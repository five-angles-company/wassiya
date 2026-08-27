import { fmtArabicDate, fmtArabicNumber } from "@workspace/ui/lib/format-ar"

import type { Locale } from "@/lib/i18n/locale"

/**
 * Numbers and dates in the reader's language.
 *
 * The Arabic side delegates to `@workspace/ui/lib/format-ar`, which moved out of
 * `apps/web` so both the claim funnel and this console share one implementation.
 * That file is worth not reinventing: it shapes Eastern Arabic-Indic digits by
 * hand because `-u-nu-arab` is not dependable across runtimes, and it carries
 * its own Gregorian month table because CLDR's `ar-SA` defaults to the Islamic
 * calendar — a console that dated a death claim by Hijri while the certificate
 * said Gregorian would be actively misleading.
 */
export function fmtNumber(value: number, locale: Locale): string {
  return locale === "ar"
    ? fmtArabicNumber(value)
    : new Intl.NumberFormat("en-GB").format(value)
}

export function fmtDate(value: number, locale: Locale): string {
  const date = new Date(value)
  return locale === "ar"
    ? fmtArabicDate(date)
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date)
}

/**
 * A capped count, as the dashboard shows it: `100+` once the query stopped
 * counting. See `admin.overview` for why the cap exists.
 */
export function fmtTally(
  tally: { count: number; more: boolean },
  locale: Locale
): string {
  const n = fmtNumber(tally.count, locale)
  return tally.more ? `${n}+` : n
}

const UNITS = ["B", "KB", "MB", "GB", "TB"] as const

/**
 * Bytes, in the reader's digits.
 *
 * Binary steps (1024) rather than decimal, matching the free-tier allowance the
 * app's own plan screen is written against. The unit stays Latin and is wrapped
 * LTR at the call site — "٤٫٢ MB" is how this reads in Arabic, because the unit
 * is a symbol rather than a word.
 */
export function fmtBytes(bytes: number, locale: Locale): string {
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  const rounded = unit === 0 ? Math.round(value) : Math.round(value * 10) / 10
  const digits =
    locale === "ar"
      ? fmtNumber(rounded, "ar")
      : new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(
          rounded
        )
  return `${digits} ${UNITS[unit]}`
}
