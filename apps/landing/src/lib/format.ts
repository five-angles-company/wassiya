import { fmtArabicNumber, toArabicDigits } from "@workspace/ui/lib/format-ar"

import type { Locale } from "@/i18n/locale"

const MB = 1_000_000
const GB = 1000 * MB

export function fmtNumber(value: number, locale: Locale): string {
  return locale === "ar" ? fmtArabicNumber(value) : new Intl.NumberFormat("en-US").format(value)
}

/** A digit string (a year, say) with no grouping. */
export function fmtDigits(value: string, locale: Locale): string {
  return locale === "ar" ? toArabicDigits(value) : value
}

/**
 * Decimal units, chosen per value — the same rule as mobile's `lib/bytes.ts`,
 * so a 500 MB tier here and on the paywall read identically.
 */
export function fmtBytes(bytes: number, locale: Locale, units: { mb: string; gb: string }): string {
  return bytes >= GB
    ? `${fmtNumber(Math.round(bytes / GB), locale)} ${units.gb}`
    : `${fmtNumber(Math.round(bytes / MB), locale)} ${units.mb}`
}
