import type { Locale } from "@/lib/i18n/locale"

/**
 * A page on the public site (apps/landing), in the reader's language: Arabic is
 * unprefixed there and English lives under `/en/`. The base is a runtime server
 * setting, so one image can point at staging or production.
 */
export function landingUrl(locale: Locale, path: string): string {
  const base = (process.env.LANDING_URL ?? "https://wassiya.app").replace(/\/$/, "")
  return `${base}${locale === "en" ? "/en" : ""}${path}`
}
