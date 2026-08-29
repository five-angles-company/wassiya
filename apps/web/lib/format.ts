import {
  fmtArabicDate,
  fmtArabicNumber,
  toArabicDigits,
} from "@workspace/ui/lib/format-ar"

import type { Locale } from "@/lib/i18n/locale"

/**
 * Numbers and dates, in whichever language is being read.
 *
 * `format-ar` in `@workspace/ui` is Arabic-only by design and stays that way —
 * it exists to render Eastern Arabic-Indic digits and Gregorian month names
 * that `Intl` cannot be trusted to produce. What it lacks is a second branch,
 * because until now this app had no second language.
 *
 * The English side deliberately uses `en-GB`: this is a Saudi-first product and
 * "31 August 2026" is the form its English readers expect, not "August 31,
 * 2026".
 */
export function fmtNumber(value: number, locale: Locale): string {
  return locale === "ar"
    ? fmtArabicNumber(value)
    : new Intl.NumberFormat("en-GB").format(value)
}

export function fmtDate(date: Date, locale: Locale): string {
  return locale === "ar"
    ? fmtArabicDate(date)
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date)
}

/**
 * A small ordinal for a step marker — "٣" or "3".
 *
 * Separate from `fmtNumber` because it never groups and never needs `Intl`: the
 * callers count steps, and a step list that reached four figures would have
 * other problems.
 */
export function fmtStepNumber(value: number, locale: Locale): string {
  return locale === "ar" ? toArabicDigits(String(value)) : String(value)
}
