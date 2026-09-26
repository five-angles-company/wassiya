// Didit identity verification.
//
// Blocking for owners at onboarding and for executors at claim time. Nothing here
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
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server"
import { writeAudit, writeStaffAudit } from "./audit"
import { requirePermission } from "./model/access"
import { getCurrentUser } from "./users"
import { reevaluateDeliveriesFor } from "./deliveries"
import { verifiedDocument } from "./model/didit"

const DEFAULT_API_URL = "https://verification.didit.me/v2/session/"

/**
 * Rejections allowed before the app stops offering a retry and hands over to
 * support. Counted server-side because a client-held counter resets on
 * reinstall, which would make the cap decorative.
 */
export const MAX_IDENTITY_ATTEMPTS = 3

export const identityStatusValidator = v.union(
  v.literal("unverified"),
  v.literal("pending"),
  v.literal("verified"),
  v.literal("rejected")
)

/**
 * What the app watches while the hosted flow is open in a browser.
 *
 * This is a Convex query, so a client subscribes to it and the Didit webhook's
 * write pushes the new status out. Nothing needs to poll.
 */
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
      // ⚠️ A session was *created*, nothing more. `recordSession` writes the
      // id the instant `startSession` returns, before the reader has shown the
      // provider a document — so this can never stand for "submitted",
      // "received" or any progress at all. It went wrong that way once; see
      // `screens/setup/kyc-pending`.
      hasOpenSession: user.diditSessionId !== undefined,
      attempts: user.identityAttempts ?? 0,
      attemptsRemaining: Math.max(
        0,
        MAX_IDENTITY_ATTEMPTS - (user.identityAttempts ?? 0)
      ),
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

/**
 * Remember which Didit session belongs to this user.
 *
 * ⚠️ **It does not touch `identityStatus`, and must not.** Creating a session is
 * the app opening a window; it says nothing about whether the reader showed the
 * provider anything. This used to set `"pending"` here, and `pending` is what
 * routes the setup flow to "your documents are being reviewed" — so opening the
 * hosted flow and closing it again parked the reader on a review screen for a
 * review that had never started, with no way back to the gate.
 *
 * Didit reports `pending` itself, over the HMAC-verified webhook, once there is
 * genuinely something in review. Waiting for that is both honest and no slower:
 * the client holds a live subscription to `identity.status`.
 */
export const recordSession = internalMutation({
  args: { userId: v.id("users"), sessionId: v.string() },
  handler: async (ctx, { userId, sessionId }) => {
    await ctx.db.patch("users", userId, { diditSessionId: sessionId })
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
    /** True only for a real provider decline — see `isDeclined` in http.ts. */
    declined: v.optional(v.boolean()),
    verifiedName: v.optional(v.string()),
    docType: v.optional(v.string()),
    /** Keyed hashes, computed in `http.ts` — never the numbers. */
    docHashes: v.optional(v.array(v.string())),
    birthDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await resolveSubject(ctx, args.sessionId, args.vendorData)
    if (user === null) {
      console.warn("Didit webhook for an unknown session")
      return null
    }

    // Only a real decline burns an attempt. Counting sessions would spend one
    // every time a user opened the hosted flow and backed out; counting every
    // "rejected" would do the same, because an expired or abandoned session
    // maps to that status too.
    const attempts =
      (user.identityAttempts ?? 0) + (args.declined === true ? 1 : 0)

    // Document fields are written only when this webhook carries them. Didit
    // sends several per session, and one without the block must not erase what
    // an earlier one — or the decision API — already recorded.
    await ctx.db.patch("users", user._id, {
      identityStatus: args.status,
      identityVerifiedAt: args.status === "verified" ? Date.now() : undefined,
      identityAttempts: attempts,
      ...(args.verifiedName === undefined
        ? {}
        : { identityVerifiedName: args.verifiedName }),
      ...(args.docType === undefined ? {} : { identityDocType: args.docType }),
      ...(args.docHashes === undefined
        ? {}
        : { identityDocHashes: args.docHashes }),
      ...(args.birthDate === undefined
        ? {}
        : { identityBirthDate: args.birthDate }),
    })
    await writeAudit(ctx, {
      userId: user._id,
      event: "identity.webhook",
      meta: {
        status: args.status,
        docType: args.docType ?? null,
        attempts,
      },
    })

    // A person who bound a delivery before verifying: their document may now
    // match the executor's registered ID number.
    if (args.status === "verified") {
      const verified = await ctx.db.get("users", user._id)
      if (verified !== null) await reevaluateDeliveriesFor(ctx, verified)
    }
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

/**
 * Give a blocked owner their Didit attempts back.
 *
 * ## The hole this fills
 *
 * At three failures the mobile app stops offering a retry and shows *"Let's
 * finish this together — contact support"*. Until this existed, support had
 * nothing to do next: no console screen listed the affected accounts and no
 * mutation could clear the counter. The product shipped a promise that its own
 * operators could not keep.
 *
 * ## What it deliberately does not do
 *
 * It does not touch `identityStatus`. The webhook is the only thing allowed to
 * write `verified`, and that stays true — this hands back an attempt, it does
 * not grant a verification. There is no admin path to `verified` and there must
 * never be one: identity is the blocking gate a whole vault rests on, and the
 * verified legal name is what a death certificate is later matched against.
 *
 * It is also not a security boundary being lifted. The three-attempt cap lives
 * in the mobile app (`identityRetriesExhausted`), not in `startSession`, so a
 * reset returns the owner to a state they could already occupy.
 *
 * The audit line records `adminUserId` in `meta` because `writeAudit`'s own
 * `userId` is the *subject* — without it the log would say this owner's
 * attempts were reset and never say by whom, which for the console's one
 * support action is the difference between an audit trail and a rumour.
 */
export const adminResetAttempts = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const actor = await requirePermission(ctx, "identity.reset")
    const user = await ctx.db.get("users", userId)
    if (user === null) {
      throw new Error("Not found")
    }
    if (user.identityStatus === "verified") {
      // Nothing to unblock, and clearing the counter would only make the audit
      // trail harder to read.
      throw new Error("This account is already verified")
    }

    const from = user.identityAttempts ?? 0
    await ctx.db.patch("users", userId, { identityAttempts: 0 })
    await writeStaffAudit(ctx, {
      actor,
      subject: userId,
      event: "identity.attempts_reset",
      meta: { from },
    })
    return null
  },
})

/**
 * Re-read a verified user's document from Didit's decision API and store it.
 * For accounts verified while the approval webhook carried no document block —
 * see `model/didit.ts`. Admin-run: `npx convex run identity:refreshDocument '{"userId":"…"}'`.
 */
export const refreshDocument = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user: { sessionId: string | null; status: string } | null =
      await ctx.runQuery(internal.identity.sessionOf, { userId })
    if (
      user === null ||
      user.sessionId === null ||
      user.status !== "verified"
    ) {
      throw new Error("No verified Didit session for this user")
    }
    const document = await verifiedDocument(user.sessionId, true, {})
    await ctx.runMutation(internal.identity.applyWebhookResult, {
      sessionId: user.sessionId,
      vendorData: userId,
      status: "verified",
      ...document,
    })
    return {
      name: document.verifiedName !== undefined,
      birthDate: document.birthDate !== undefined,
      numbers: document.docHashes?.length ?? 0,
    }
  },
})

export const sessionOf = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get("users", userId)
    if (user === null) return null
    return {
      sessionId: user.diditSessionId ?? null,
      status: user.identityStatus ?? "unverified",
    }
  },
})
