// What ٩.٤, the paywall and the console read.
//
// These queries exist so that no client ever writes a limit down. The numbers
// come from `model/plans.ts`, the counts from the same helpers the mutations
// enforce with, so the meter, the paywall sentence and the refusal can never
// disagree — which they would the first time a tier was edited and a hardcoded
// "٥٠٠ م.ب" stayed behind in a string file.
//
// They deliberately serve no price. Prices are set per storefront and rendered
// from the store's own `priceString`.
import { v } from "convex/values"

import { internalMutation, query } from "./_generated/server"
import { requirePermission, requireUser } from "./model/access"
import { usageFor } from "./model/entitlements"
import { limitsFor, limitsOfPlan, PLAN_IDS, planOf } from "./model/plans"

export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const now = Date.now()
    const limits = await limitsFor(ctx, user, now)
    const plan = planOf(user)

    return {
      plan,
      // `renewsAt`, and deliberately not a `lapsed` boolean beside it: a query
      // result only changes when its data does, so a boolean computed here
      // would still read "active" an hour after the subscription ended, on a
      // screen that is left open for minutes at a time. The client owns that
      // comparison. `limits` is different — it is what the mutations enforce,
      // and a stale copy of it can only ever be corrected by the server
      // refusing.
      renewsAt: user.subscription?.renewsAt ?? null,
      limits,
      usage: await usageFor(ctx, user, limits),
      // What the paywall is selling, so its copy can state the actual numbers
      // instead of repeating numbers that were true when it was written. Null
      // for an owner already on the annual plan, who is not being sold
      // anything.
      upgrade: plan === "annual" ? null : await limitsOfPlan(ctx, "annual"),
    }
  },
})

/** The whole catalogue, for the console's editor. */
export const catalogue = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "billing.read")
    return await Promise.all(
      PLAN_IDS.map(async (key) => ({
        key,
        limits: await limitsOfPlan(ctx, key),
      }))
    )
  },
})

/**
 * One-off: the storage counter used to live inside `subscription`, which is now
 * reserved for entitlement and has exactly two writers. Run once per deployment
 * with `npx convex run plans:backfillStorageUsage`, then the legacy field can
 * be dropped from the schema.
 */
export const backfillStorageUsage = internalMutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const users = await ctx.db.query("users").take(limit ?? 1000)
    let moved = 0
    for (const user of users) {
      const legacy = user.subscription?.storageBytesUsed
      if (legacy === undefined || user.storageBytesUsed !== undefined) {
        continue
      }
      await ctx.db.patch("users", user._id, { storageBytesUsed: legacy })
      moved += 1
    }
    return { scanned: users.length, moved }
  },
})
