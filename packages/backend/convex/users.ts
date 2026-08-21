import { v, type Validator } from "convex/values"
import type { UserJSON } from "@clerk/backend"
import { internalMutation, query, type QueryCtx } from "./_generated/server"

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
export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> },
  handler: async (ctx, { data }) => {
    const attributes = {
      externalId: data.id,
      name: [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
      email: primaryEmail(data),
    }

    const user = await userByExternalId(ctx, data.id)
    if (user === null) {
      await ctx.db.insert("users", attributes)
    } else {
      await ctx.db.patch("users", user._id, attributes)
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
    (address) => address.id === data.primary_email_address_id,
  )
  return primary?.email_address ?? data.email_addresses[0]?.email_address ?? null
}
