/**
 * The same thin `{ ar, en }` catalogue as `apps/web/lib/i18n/locale.ts`, minus
 * the cookie: here the locale is the URL. Arabic is unprefixed and English lives
 * under `/en/`, which is what `astro.config.mjs` declares.
 */
import { SITE } from "@/config/site"

export type Locale = "ar" | "en"

export const LOCALES: readonly Locale[] = ["ar", "en"]

export type LabelSet = { ar: string; en: string }

export type Dictionary = Record<string, LabelSet>

export type Resolved<D extends Dictionary> = { [K in keyof D]: string }

export function t<D extends Dictionary>(dict: D, locale: Locale): Resolved<D> {
  const out = {} as Resolved<D>
  for (const key of Object.keys(dict) as (keyof D)[]) {
    out[key] = dict[key]![locale]
  }
  return out
}

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr"
}

export function other(locale: Locale): Locale {
  return locale === "ar" ? "en" : "ar"
}

/** A site path in `locale`. `path` is locale-free and starts with `/`. */
export function pathFor(locale: Locale, path: string): string {
  return locale === "ar" ? path : path === "/" ? "/en/" : `/en${path}`
}

/** The same page with its locale prefix removed. */
export function stripLocale(pathname: string): string {
  const bare = pathname.replace(/^\/en(?=\/|$)/, "")
  return bare === "" ? "/" : bare
}

/**
 * A link into the web app, in the reader's language.
 *
 * The web app keeps its locale in a cookie this site cannot set (another
 * origin), so `?lang=` carries it across; `apps/web/proxy.ts` turns it into the
 * cookie and redirects the parameter away.
 */
export function webUrl(locale: Locale, path: string): string {
  return `${SITE.webUrl}${path}?lang=${locale}`
}

export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)
}
