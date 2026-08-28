import { v, type Validator } from "convex/values"
import type { UserJSON } from "@clerk/backend"
import type { Doc } from "./_generated/dataModel"
import {
  internalMutation,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server"
import { writeAudit } from "./audit"

// Protected query. A non-null result proves the Clerk JWT reached Convex and
// `auth.config.ts` validated it. `email`/`name` come from the synced `users`
// row written by the webhook — not from the JWT, whose default claims carry
// neither — so `synced: true` also confirms the webhook fired.
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      return null
    }
    const user = await getCurrentUser(ctx)
    return {
      subject: identity.subject,
      email: user?.email ?? null,
      name: user?.name ?? null,
      synced: user !== null,
    }
  },
})

// Called by the Clerk webhook (http.ts) on user.created / user.updated.
// Internal: only other Convex functions can reach it, never the public API.
//
// `attributes` holds *only* the three Clerk-owned columns, and the update path
// is `patch`, which shallow-merges — so a re-sync can never touch `country`,
// `identityStatus`, `role` or `subscription`. The insert path seeds the two
// fields every Wassiya function reads, so downstream code never has to treat
// "column absent" and "unverified" as two different states.
export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> },
  handler: async (ctx, { data }) => {
    const name =
      [data.first_name, data.last_name].filter(Boolean).join(" ") || null
    const email = primaryEmail(data)
    const attributes = {
      externalId: data.id,
      name,
      email,
      // The console searches one column, so it is composed where the two halves
      // are written. This is the only writer of either — a stale value here
      // fails silently, as an owner the console cannot find.
      searchText: [name, email].filter(Boolean).join(" "),
    }

    const user = await userByExternalId(ctx, data.id)
    if (user === null) {
      await ctx.db.insert("users", {
        ...attributes,
        role: "owner" as const,
        identityStatus: "unverified" as const,
      })
    } else {
      await ctx.db.patch("users", user._id, attributes)
    }
  },
})

// The onboarding profile. Country is a parameter the rest of the app reads,
// never a branch anything switches on.
export const saveProfile = mutation({
  args: {
    country: v.optional(v.string()),
    locale: v.optional(v.string()),
    criticalContacts: v.optional(
      v.array(v.object({ kind: v.string(), value: v.string() }))
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)
    const patch: Partial<Doc<"users">> = {}
    if (args.country !== undefined) {
      patch.country = args.country
    }
    if (args.locale !== undefined) {
      patch.locale = args.locale
    }
    if (args.criticalContacts !== undefined) {
      patch.criticalContacts = args.criticalContacts
    }
    await ctx.db.patch("users", user._id, patch)
    await writeAudit(ctx, {
      userId: user._id,
      event: "profile.saved",
      meta: { fields: Object.keys(patch).join(",") },
    })
    return null
  },
})

// Everything a signed-in owner's shell needs in one read: who they are, whether
// Didit cleared them, and when their subscription lapses.
//
// It returns `subscription.renewsAt` rather than a `canAddAssets` boolean on
// purpose. A query is not rerun because time passed, so a boolean computed from
// `Date.now()` here would freeze at whatever it was when the query last ran and
// only correct itself on an unrelated write. The client has a live clock; the
// authoritative check is `assertCanAddAssets` in `assets.create` regardless.
export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (user === null) {
      return null
    }
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      country: user.country ?? null,
      locale: user.locale ?? null,
      criticalContacts: user.criticalContacts ?? [],
      identityStatus: user.identityStatus ?? "unverified",
      identityVerifiedName: user.identityVerifiedName ?? null,
      role: user.role ?? "owner",
      subscription: user.subscription ?? null,
    }
  },
})

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const user = await userByExternalId(ctx, clerkUserId)
    if (user === null) {
      console.warn(`No user to delete for Clerk id ${clerkUserId}`)
      return
    }
    await ctx.db.delete("users", user._id)
  },
})

// Use these in your own functions to get the caller. NEVER take a user id as a
// function argument for authorization — always derive it from the token.
export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (identity === null) {
    return null
  }
  return await userByExternalId(ctx, identity.subject)
}

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx)
  if (user === null) {
    throw new Error("Not authenticated")
  }
  return user
}

// `identity.subject` is the Clerk user id, which is what the webhook stores as
// `externalId`. auth.config.ts registers a single provider, so it is unique on
// its own; add `identity.issuer` to the key if you ever add a second provider.
async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
    .unique()
}

function primaryEmail(data: UserJSON): string | null {
  const primary = data.email_addresses.find(
    (address) => address.id === data.primary_email_address_id
  )
  return (
    primary?.email_address ?? data.email_addresses[0]?.email_address ?? null
  )
}
