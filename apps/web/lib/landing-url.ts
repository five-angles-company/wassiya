import type { Locale } from "@/lib/i18n/locale"

/**
 * A page on the public site (apps/landing), in the reader's language: Arabic is
 * unprefixed there and English lives under `/en/`. The base is a runtime server
 * setting, so one image can point at staging or production. Unset, it is the
 * local landing in development (its port in `apps/landing/astro.config.mjs`)
 * and wassiya.app in production.
 */
export function landingUrl(locale: Locale, path: string): string {
  const fallback = process.env.NODE_ENV === "production" ? "https://wassiya.app" : "http://localhost:3000"
  const base = (process.env.LANDING_URL || fallback).replace(/\/$/, "")
  return `${base}${locale === "en" ? "/en" : ""}${path}`
}
