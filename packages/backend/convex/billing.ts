// Entitlement: the only module allowed to write `users.subscription`.
//
// Everything that decides whether an owner has paid lives here, and
// `scripts/verify-invariants.mjs` enforces that nothing else writes the column.
// The reason is worth stating plainly: a client-callable mutation that patches
// `subscription` is a free subscription for anyone who reads the app bundle,
// and unlike a leaked key it looks like ordinary code in review.
//
// Two writers, and there will never be a third:
//
//   1. `applyStoreEvent` — the RevenueCat webhook and the post-purchase
//      refresh. Internal, so only this deployment can call it. (Not built yet;
//      it lands with the store integration.)
//   2. `adminSetPlan` — an audited staff grant, for comps, support, refunds
//      and the dev deployment, where there is no store at all.
//
// Usage counters deliberately live outside `subscription` — `storageBytesUsed`
// is bumped on every upload and would otherwise have to be an exception to the
// rule above.
import { v } from "convex/values"

import { mutation } from "./_generated/server"
import { writeAudit } from "./audit"
import { requireAdmin } from "./model/access"

const planArg = v.union(v.literal("free"), v.literal("annual"))

/** Whole months, so a grant lands on the same day of a later month. */
function addMonths(from: number, months: number): number {
  const date = new Date(from)
  date.setMonth(date.getMonth() + months)
  return date.getTime()
}

/**
 * Grant, extend or revoke a plan by hand.
 *
 * The console's one billing action, and on the dev deployment the *only* way a
 * paid plan can exist — there is no store there, and without this the entire
 * annual path would be unreachable and therefore untested.
 *
 * ## Extending starts from the existing date, not from today
 *
 * A support grant on top of a live subscription means "twelve more months", and
 * measuring from now would silently eat whatever was left. A positive term
 * measures from `renewsAt` whenever that is still in the future; a negative
 * one always measures from now.
 *
 * ## A negative `months` is deliberate
 *
 * It is how a lapse is produced: a plan whose `renewsAt` has passed, with
 * everything else intact. That state has its own behaviour — reads and heir
 * delivery keep working while adding stops — and it cannot be verified without
 * a way to enter it. Revoking outright is `plan: "free"` instead, which is a
 * different thing and reads differently in the audit log.
 *
 * `adminUserId` goes in `meta` because `writeAudit`'s own `userId` is the
 * *subject*: without it the log would record that this owner was given a year
 * and never record who gave it.
 */
export const adminSetPlan = mutation({
  args: {
    userId: v.id("users"),
    plan: planArg,
    /** Ignored for `free`. Defaults to a year; may be negative. */
    months: v.optional(v.number()),
  },
  handler: async (ctx, { userId, plan, months }) => {
    const admin = await requireAdmin(ctx)
    const user = await ctx.db.get("users", userId)
    if (user === null) {
      throw new Error("Not found")
    }

    const now = Date.now()
    const previous = user.subscription

    if (plan === "free") {
      // No `renewsAt`: a free plan that carried a date would read as lapsed
      // on every screen that compares the two.
      await ctx.db.patch("users", userId, {
        subscription: { plan: "free", source: "staff" },
      })
      await writeAudit(ctx, {
        userId,
        event: "billing.plan_set",
        meta: {
          plan,
          from: previous?.plan ?? "free",
          adminUserId: admin._id,
        },
      })
      return null
    }

    const term = months ?? 12
    // Extending measures from the existing date; expiring measures from now.
    // Both from the existing date would make "expire" a no-op on anything
    // renewing more than a month out — it would move the date backwards and
    // leave it in the future, reporting success while changing nothing.
    const extending =
      term > 0 && previous?.renewsAt !== undefined && previous.renewsAt > now
    const renewsAt = addMonths(extending ? previous.renewsAt! : now, term)

    await ctx.db.patch("users", userId, {
      // `productId` and `store` are dropped rather than carried over: a staff
      // grant did not come from a store, and a stale product id beside it
      // would be a lie the next support ticket reads as fact.
      subscription: { plan: "annual", renewsAt, source: "staff" },
    })
    await writeAudit(ctx, {
      userId,
      event: "billing.plan_set",
      meta: {
        plan,
        from: previous?.plan ?? "free",
        months: term,
        renewsAt,
        adminUserId: admin._id,
      },
    })
    return null
  },
})

/** A limit as the console sends it: a number, or `null` for unlimited. */
const limitArg = v.union(v.number(), v.null())

const limitsArg = v.object({
  storageBytes: limitArg,
  assets: limitArg,
  heirs: limitArg,
  photos: v.boolean(),
  maxFileBytes: limitArg,
})

/**
 * Edit a plan's limits.
 *
 * Entitlement, which is why it lives here and not in `admin.ts`: raising the
 * free plan's caps high enough gives the product away to everyone at once, and
 * that is a quieter way to do it than granting subscriptions one by one.
 *
 * The new limits apply immediately, to everyone on the plan. An owner already
 * past a lowered cap keeps every asset and every heir and simply cannot add
 * the next one — limits gate adding, never reading, and never release. Nothing
 * here can delete anything.
 *
 * Writes the whole row rather than patching fields, so a half-sent form cannot
 * leave a plan with one new number and four old ones.
 */
export const adminSetLimits = mutation({
  args: { plan: planArg, limits: limitsArg },
  handler: async (ctx, { plan, limits }) => {
    const admin = await requireAdmin(ctx)
    const now = Date.now()

    const existing = await ctx.db
      .query("plans")
      .withIndex("by_key", (q) => q.eq("key", plan))
      .first()

    if (existing === null) {
      await ctx.db.insert("plans", { key: plan, ...limits, updatedAt: now })
    } else {
      await ctx.db.patch("plans", existing._id, { ...limits, updatedAt: now })
    }

    // The subject is the plan, not a person, so this line names the admin in
    // `userId` as well: the audit log has nowhere else to put an event that is
    // about everybody.
    await writeAudit(ctx, {
      userId: admin._id,
      event: "billing.limits_set",
      meta: {
        plan,
        storageBytes: limits.storageBytes,
        assets: limits.assets,
        heirs: limits.heirs,
        photos: limits.photos,
        maxFileBytes: limits.maxFileBytes,
        adminUserId: admin._id,
      },
    })
    return null
  },
})

/**
 * Raise or lower one account's limits, field by field, on top of its plan.
 *
 * For a pilot, a support case, an owner who needs more room than their tier
 * gives. Passing `null` for the whole object removes the override and returns
 * the account to its plan.
 *
 * An absent field means "not overridden"; a `null` field means unlimited. The
 * two must stay distinguishable — see `limitsFor`, where collapsing them with
 * `??` would silently turn every unlimited override back into the plan's cap.
 */
export const adminSetOverride = mutation({
  args: {
    userId: v.id("users"),
    limits: v.union(
      v.object({
        storageBytes: v.optional(limitArg),
        assets: v.optional(limitArg),
        heirs: v.optional(limitArg),
        photos: v.optional(v.boolean()),
        maxFileBytes: v.optional(limitArg),
      }),
      v.null()
    ),
  },
  handler: async (ctx, { userId, limits }) => {
    const admin = await requireAdmin(ctx)
    const user = await ctx.db.get("users", userId)
    if (user === null) {
      throw new Error("Not found")
    }

    await ctx.db.patch("users", userId, {
      limitsOverride: limits === null ? undefined : limits,
    })
    await writeAudit(ctx, {
      userId,
      event: "billing.override_set",
      meta: {
        cleared: limits === null,
        fields: limits === null ? "" : Object.keys(limits).join(","),
        adminUserId: admin._id,
      },
    })
    return null
  },
})
