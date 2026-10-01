/**
 * `plans.published` as the Plans section prints it. One function for the build
 * and for the browser refresh (`scripts/plans-live.ts`), so the two can never
 * print the same limit differently.
 */
import { fmtPrice } from "@workspace/ui/lib/price"

import type { Locale } from "@/i18n/locale"
import { fmtBytes, fmtNumber } from "@/lib/format"
import type { PublishedPlans } from "@/lib/plans"

/** The copy this needs, picked out of `HOME` so the browser bundle stays small. */
export const PLAN_STRING_KEYS = [
  "planUnlimited",
  "planUpTo",
  "planIncluded",
  "planNotIncluded",
  "unitMb",
  "unitGb",
  "planPerYear",
  "planPerMonth",
  "planTaxIncluded",
  "planTaxExcluded",
] as const
export type PlanStrings = Record<(typeof PLAN_STRING_KEYS)[number], string>

export type PlanValues = {
  storage: string
  assets: string
  executors: string
  photos: string
  photosOn: boolean
  fileSize: string
}

/** `DEFAULT_MARKET` in `convex/model/prices.ts`: every store country without its own row. */
const EVERY_MARKET = "*"
// Until the site has a page per market, each language shows one: Arabic the
// Saudi store's price, English the every-other-country row.
const MARKET: Record<Locale, string> = { ar: "SA", en: EVERY_MARKET }

/** A deployment older than the ceilings serves none; its limits are not printable. */
export function isReadable(plans: PublishedPlans | null): plans is PublishedPlans {
  return plans !== null && plans.ceilings !== undefined
}

// A size with no cap is "unlimited"; a count with none stops at the vault's
// ceiling, and says "up to" it.
export function valuesFor(
  plans: PublishedPlans,
  plan: "free" | "annual",
  locale: Locale,
  s: PlanStrings
): PlanValues {
  const limits = plans[plan]
  const units = { mb: s.unitMb, gb: s.unitGb }
  const size = (bytes: number | null) => (bytes === null ? s.planUnlimited : fmtBytes(bytes, locale, units))
  const upTo = (value: number | null, ceiling: number) =>
    value === null ? s.planUpTo.replace("{n}", fmtNumber(ceiling, locale)) : fmtNumber(value, locale)
  return {
    storage: size(limits.storageBytes),
    assets: upTo(limits.assets, plans.ceilings.assets),
    executors: upTo(limits.executors, plans.ceilings.executors),
    photos: limits.photos ? s.planIncluded : s.planNotIncluded,
    photosOn: limits.photos,
    fileSize:
      limits.maxFileBytes === null
        ? s.planUnlimited
        : s.planUpTo.replace("{n}", fmtBytes(limits.maxFileBytes, locale, units)),
  }
}

/** The yearly price for this page's market, or `null` when there is none to show. */
export function priceFor(
  plans: PublishedPlans | null,
  locale: Locale,
  s: PlanStrings
): { display: string; note: string; perMonth: string } | null {
  const prices = plans?.prices ?? []
  const price =
    prices.find((row) => row.market === MARKET[locale]) ??
    prices.find((row) => row.market === EVERY_MARKET) ??
    null
  if (price === null) {
    return null
  }
  return {
    display: fmtPrice(price.amountMinor, price.currency, locale),
    note: `${s.planPerYear}${locale === "ar" ? "، " : ", "}${price.taxInclusive ? s.planTaxIncluded : s.planTaxExcluded}`,
    perMonth: s.planPerMonth.replace(
      "{price}",
      fmtPrice(Math.round(price.amountMinor / 12), price.currency, locale)
    ),
  }
}
