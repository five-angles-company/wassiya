// Didit identity verification.
//
// Blocking for owners at onboarding and for heirs at claim time. Nothing here
// touches key material: proving who someone is and holding their keys are
// separate jobs, and this file only ever does the first.
//
// `DIDIT_API_KEY` and `DIDIT_WEBHOOK_SECRET` live in the **Convex deployment
// env** (`npx convex env set …`), not in any `.env.local` — see the root
// AGENTS.md "three separate env stores".
import { v } from "convex/values"

import type { Doc, Id } from "./_generated/dataModel"
import { internal } from "./_generated/api"
import {
  action,
  internalMutation,
  internalQuery,
  query,
  type MutationCtx,
} from "./_generated/server"
import { writeAudit } from "./audit"
import { getCurrentUser } from "./users"

const DEFAULT_API_URL = "https://verification.didit.me/v2/session/"

export const identityStatusValidator = v.union(
  v.literal("unverified"),
  v.literal("pending"),
  v.literal("verified"),
  v.literal("rejected")
)

/** What the app polls while the hosted flow is open in a browser. */
export const status = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (user === null) {
      return null
    }
    return {
      status: user.identityStatus ?? "unverified",
      verifiedName: user.identityVerifiedName ?? null,
      docType: user.identityDocType ?? null,
      verifiedAt: user.identityVerifiedAt ?? null,
      hasOpenSession: user.diditSessionId !== undefined,
    }
  },
})

/**
 * Create a Didit hosted-flow session for the signed-in user and hand back the
 * URL to open. The verdict does not come back through this call — it arrives
 * later on `/didit-webhook`, which is the only thing allowed to write
 * `identityStatus: "verified"`.
 */
export const startSession = action({
  args: { callbackUrl: v.optional(v.string()) },
  handler: async (ctx, args): Promise<{ sessionId: string; url: string }> => {
    const viewer: { id: Id<"users">; status: string } | null =
      await ctx.runQuery(internal.identity.viewer, {})
    if (viewer === null) {
      throw new Error("Not authenticated")
    }
    if (viewer.status === "verified") {
      throw new Error("Identity is already verified")
    }

    const apiKey = process.env.DIDIT_API_KEY
    if (apiKey === undefined) {
      throw new Error(
        "DIDIT_API_KEY is not set on the Convex deployment (npx convex env set DIDIT_API_KEY …)"
      )
    }

    const response = await fetch(process.env.DIDIT_API_URL ?? DEFAULT_API_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        workflow_id: process.env.DIDIT_WORKFLOW_ID,
        vendor_data: viewer.id,
        callback: args.callbackUrl,
      }),
    })
    if (!response.ok) {
      // Deliberately no body echo: a provider error page can quote the request.
      throw new Error(`Didit session creation failed (${response.status})`)
    }

    const body = (await response.json()) as {
      session_id?: string
      url?: string
    }
    if (typeof body.session_id !== "string" || typeof body.url !== "string") {
      throw new Error("Didit returned an unexpected session payload")
    }

    await ctx.runMutation(internal.identity.recordSession, {
      userId: viewer.id,
      sessionId: body.session_id,
    })
    return { sessionId: body.session_id, url: body.url }
  },
})

export const viewer = internalQuery({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (user === null) {
      return null
    }
    return { id: user._id, status: user.identityStatus ?? "unverified" }
  },
})

export const recordSession = internalMutation({
  args: { userId: v.id("users"), sessionId: v.string() },
  handler: async (ctx, { userId, sessionId }) => {
    await ctx.db.patch("users", userId, {
      diditSessionId: sessionId,
      identityStatus: "pending",
    })
    await writeAudit(ctx, {
      userId,
      event: "identity.session_started",
      meta: { sessionId },
    })
    return null
  },
})

/**
 * Written only by the verified webhook in `http.ts`. `vendorData` is the user
 * id we sent when creating the session; the session id is the fallback lookup
 * for providers that do not echo it back.
 */
export const applyWebhookResult = internalMutation({
  args: {
    sessionId: v.string(),
    vendorData: v.optional(v.string()),
    status: identityStatusValidator,
    verifiedName: v.optional(v.string()),
    docType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await resolveSubject(ctx, args.sessionId, args.vendorData)
    if (user === null) {
      console.warn("Didit webhook for an unknown session")
      return null
    }

    await ctx.db.patch("users", user._id, {
      identityStatus: args.status,
      identityVerifiedName: args.verifiedName,
      identityDocType: args.docType,
      identityVerifiedAt: args.status === "verified" ? Date.now() : undefined,
    })
    await writeAudit(ctx, {
      userId: user._id,
      event: "identity.webhook",
      meta: { status: args.status, docType: args.docType ?? null },
    })
    return null
  },
})

/**
 * Find the user this webhook is about. `vendorData` is the id we handed Didit
 * at session creation and is the authoritative link; the session-id index is
 * the fallback for a provider that does not echo it back.
 */
async function resolveSubject(
  ctx: MutationCtx,
  sessionId: string,
  vendorData: string | undefined
): Promise<Doc<"users"> | null> {
  if (vendorData !== undefined) {
    // `normalizeId` returns null for a string that is not an id for this table,
    // which `db.get` would instead throw on — and this input is attacker-shaped.
    const id = ctx.db.normalizeId("users", vendorData)
    if (id !== null) {
      const byVendorData = await ctx.db.get("users", id)
      if (byVendorData !== null) {
        return byVendorData
      }
    }
  }
  return await ctx.db
    .query("users")
    .withIndex("by_diditSessionId", (q) => q.eq("diditSessionId", sessionId))
    .unique()
}
