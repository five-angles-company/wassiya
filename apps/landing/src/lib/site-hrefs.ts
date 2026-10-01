import type { SiteHrefs } from "@workspace/ui/lib/site"

import { other, pathFor, stripLocale, webUrl, type Locale } from "@/i18n/locale"

/** The shared header and footer's links, as this site reaches them. */
export function siteHrefs(locale: Locale, pathname: string): SiteHrefs {
  const home = pathFor(locale, "/")
  return {
    home,
    how: `${home}#how`,
    security: `${home}#security`,
    plans: `${home}#plans`,
    faq: `${home}#faq`,
    help: webUrl(locale, "/help"),
    reportDeath: webUrl(locale, "/file"),
    terms: pathFor(locale, "/legal/terms"),
    privacy: pathFor(locale, "/legal/privacy"),
    encryption: pathFor(locale, "/legal/encryption"),
    language: pathFor(other(locale), stripLocale(pathname)),
  }
}
