// Plan prices as the website shows them. Read here, written only in `prices.ts`.
//
// ⚠️ Display only. The stores decide what an owner is charged; these rows say
// what wassiya.app prints. Formatting (symbol, digits, decimals) is the
// client's job through `Intl.NumberFormat`, so adding a country is a row and
// never code.
import type { QueryCtx } from "../_generated/server"
import type { PlanId } from "./plans"

/** The row for every store country that has none of its own. */
export const DEFAULT_MARKET = "*"

/** A plan never has more rows than there are store countries. */
export const MAX_PRICE_ROWS = 300

export type PublishedPrice = {
  market: string
  currency: string
  amountMinor: number
  taxInclusive: boolean
}

export function isMarket(value: string): boolean {
  return value === DEFAULT_MARKET || /^[A-Z]{2}$/.test(value)
}

export function isCurrency(value: string): boolean {
  return /^[A-Z]{3}$/.test(value)
}

export async function pricesOf(
  ctx: QueryCtx,
  plan: PlanId
): Promise<PublishedPrice[]> {
  const rows = await ctx.db
    .query("planPrices")
    .withIndex("by_plan_and_market", (q) => q.eq("plan", plan))
    .take(MAX_PRICE_ROWS)
  return rows.map(({ market, currency, amountMinor, taxInclusive }) => ({
    market,
    currency,
    amountMinor,
    taxInclusive,
  }))
}
