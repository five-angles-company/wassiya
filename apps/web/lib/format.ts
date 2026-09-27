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

const BYTE_UNITS = {
  ar: ["بايت", "ك.ب", "م.ب", "غ.ب"],
  en: ["B", "KB", "MB", "GB"],
} as const

/** A file size, rounded for reading: "٤٫٢ م.ب" or "4.2 MB". */
export function fmtBytes(bytes: number, locale: Locale): string {
  const units = BYTE_UNITS[locale]
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  const text = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: unit >= 2 ? 1 : 0,
  }).format(value)
  const shaped =
    locale === "ar"
      ? toArabicDigits(text).replace(/,/g, "٬").replace(".", "٫")
      : text
  return `${shaped} ${units[unit]}`
}

/**
 * A Latin machine string (an email, a reference) placed inside running text.
 * The first-strong isolate stops the bidi algorithm reordering it against the
 * Arabic around it — plain concatenation turns `ahmad@example.com` into
 * `example.com@ahmad` on screen.
 */
export function isolate(text: string): string {
  return `⁨${text}⁩`
}
