// Plan prices for wassiya.app: the only module that writes `planPrices`
// (`scripts/verify-invariants.mjs`).
//
// ⚠️ **Display only, and that is the whole risk.** What an owner is charged is
// set in App Store Connect and Google Play, per country, and the paywall shows
// the store's own `priceString`. A row here that disagrees with the store
// advertises a price nobody can buy at — so a save stamps `verifiedAt`, and the
// console asks the operator to confirm they checked the store before it lets
// them save. Change the store first, then this.
//
// Gated on the same `billing.*` keys as the plan limits: a price is what every
// visitor reads before they install.
import { v } from "convex/values"

import { internalMutation, mutation, query } from "./_generated/server"
import { writeStaffAudit } from "./audit"
import { requirePermission } from "./model/access"
import {
  DEFAULT_MARKET,
  isCurrency,
  isMarket,
  MAX_PRICE_ROWS,
} from "./model/prices"

const planArg = v.union(v.literal("free"), v.literal("annual"))

/** Every price row of a plan, for the console's editor. */
export const catalogue = query({
  args: { plan: planArg },
  handler: async (ctx, { plan }) => {
    await requirePermission(ctx, "billing.read")
    return await ctx.db
      .query("planPrices")
      .withIndex("by_plan_and_market", (q) => q.eq("plan", plan))
      .take(MAX_PRICE_ROWS)
  },
})

/** Add or replace one country's price. Saving is the operator's word that it matches the store. */
export const adminSet = mutation({
  args: {
    plan: planArg,
    market: v.string(),
    currency: v.string(),
    amountMinor: v.number(),
    taxInclusive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "billing.manage")
    if (args.plan === "free") {
      throw new Error("The free plan has no price.")
    }
    const market = args.market.trim().toUpperCase()
    const currency = args.currency.trim().toUpperCase()
    if (!isMarket(market)) {
      throw new Error("A market is a two-letter country code, or the default.")
    }
    if (!isCurrency(currency)) {
      throw new Error("A currency is a three-letter ISO 4217 code.")
    }
    if (
      !Number.isSafeInteger(args.amountMinor) ||
      args.amountMinor <= 0 ||
      args.amountMinor >= 1_000_000_000
    ) {
      throw new Error("An amount is a positive whole number of minor units.")
    }

    const now = Date.now()
    const fields = {
      currency,
      amountMinor: args.amountMinor,
      taxInclusive: args.taxInclusive,
      verifiedAt: now,
      updatedAt: now,
      updatedBy: actor._id,
    }
    const existing = await ctx.db
      .query("planPrices")
      .withIndex("by_plan_and_market", (q) =>
        q.eq("plan", args.plan).eq("market", market)
      )
      .unique()
    if (existing === null) {
      await ctx.db.insert("planPrices", { plan: args.plan, market, ...fields })
    } else {
      await ctx.db.patch("planPrices", existing._id, fields)
    }

    // The subject is a price, not a person, so the actor stands in, as for
    // `billing.limits_set`.
    await writeStaffAudit(ctx, {
      actor,
      subject: actor._id,
      event: "billing.price_set",
      meta: {
        plan: args.plan,
        market,
        currency,
        amountMinor: args.amountMinor,
        taxInclusive: args.taxInclusive,
        from: existing === null ? "" : `${existing.currency} ${existing.amountMinor}`,
      },
    })
    return null
  },
})

/** Stop showing a price for one country. Without a row, that country falls to the default. */
export const adminRemove = mutation({
  args: { plan: planArg, market: v.string() },
  handler: async (ctx, { plan, market }) => {
    const actor = await requirePermission(ctx, "billing.manage")
    const row = await ctx.db
      .query("planPrices")
      .withIndex("by_plan_and_market", (q) =>
        q.eq("plan", plan).eq("market", market)
      )
      .unique()
    if (row === null) {
      return null
    }
    await ctx.db.delete("planPrices", row._id)
    await writeStaffAudit(ctx, {
      actor,
      subject: actor._id,
      event: "billing.price_removed",
      meta: { plan, market, currency: row.currency, amountMinor: row.amountMinor },
    })
    return null
  },
})

/**
 * Sample prices for previewing the site and the console:
 * `npx convex run prices:seedPreview`. Adds only the countries that have no
 * row, so it never overwrites a price someone set. Not real prices — check
 * them against the stores before a production deployment shows any.
 */
export const seedPreview = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const samples = [
      { market: DEFAULT_MARKET, currency: "USD", amountMinor: 9999, taxInclusive: false },
      { market: "SA", currency: "SAR", amountMinor: 37999, taxInclusive: true },
      { market: "AE", currency: "AED", amountMinor: 36999, taxInclusive: true },
    ]
    let added = 0
    for (const sample of samples) {
      const existing = await ctx.db
        .query("planPrices")
        .withIndex("by_plan_and_market", (q) =>
          q.eq("plan", "annual").eq("market", sample.market)
        )
        .unique()
      if (existing !== null) {
        continue
      }
      await ctx.db.insert("planPrices", {
        plan: "annual",
        ...sample,
        verifiedAt: now,
        updatedAt: now,
      })
      added += 1
    }
    return { added }
  },
})
