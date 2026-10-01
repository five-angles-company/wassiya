import type { SiteHrefs } from "@workspace/ui/lib/site"

import type { Locale } from "@/lib/i18n/locale"
import { landingUrl } from "@/lib/landing-url"

/**
 * The shared header and footer's links, as this app reaches them: the site's
 * sections on wassiya.app, its own pages here. The language link is the page
 * itself with `?lang=`, which `proxy.ts` turns into the cookie — so it works
 * without JavaScript.
 */
export function siteHrefs(locale: Locale, here: string): SiteHrefs {
  const other: Locale = locale === "ar" ? "en" : "ar"
  return {
    home: landingUrl(locale, "/"),
    how: landingUrl(locale, "/#how"),
    security: landingUrl(locale, "/#security"),
    plans: landingUrl(locale, "/#plans"),
    faq: landingUrl(locale, "/#faq"),
    help: "/help",
    reportDeath: "/file",
    terms: landingUrl(locale, "/legal/terms"),
    privacy: landingUrl(locale, "/legal/privacy"),
    encryption: landingUrl(locale, "/legal/encryption"),
    language: `${here}${here.includes("?") ? "&" : "?"}lang=${other}`,
  }
}
