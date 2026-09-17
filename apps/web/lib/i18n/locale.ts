/**
 * The site's locale, and the one place that decides what "Arabic" means for
 * layout.
 *
 * Read from a cookie rather than the signed-in profile, because **most people
 * who open this site are not signed in**: the claim funnel's first screen is
 * for someone just bereaved with no account, and a guardian arrives on an
 * emailed link. It also has to be known before render — `dir` belongs on
 * `<html>`, which a Server Component emits, and a cookie is readable there
 * where `localStorage` is not.
 *
 * The cost, stated: `cookies()` is a Request API, so every route under the root
 * layout renders dynamically, including `/claim`. That is a public page correct
 * in the first byte over one cached and briefly backwards; `apps/landing` is
 * the static marketing site.
 *
 * Still no i18n library — the same thin catalogue the console and mobile app
 * use, so a swap stays mechanical in all three at once.
 */
export type Locale = "ar" | "en"

/** Wassiya is Arabic-first. English is the opt-in, not the fallback. */
export const DEFAULT_LOCALE: Locale = "ar"

export const LOCALE_COOKIE = "locale"

/** A year. The toggle is a preference, not a session. */
export const LOCALE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * Narrow an untrusted cookie value to a locale.
 *
 * Anything unrecognised becomes Arabic rather than throwing: a corrupt cookie
 * should render the default site, not an error page.
 */
export function resolveLocale(value: string | undefined | null): Locale {
  return value === "en" ? "en" : DEFAULT_LOCALE
}

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr"
}

/**
 * Persist the reader's choice. Browser-only — `document` does not exist on the
 * server, and nothing server-side should be writing this.
 *
 * Lives here rather than inline in the toggle because the React compiler reads
 * an assignment to `document.cookie` inside a component as mutating a value it
 * considers immutable. It is a legitimate write; keeping it in a plain module
 * function puts it outside the compiler's component analysis and next to the
 * cookie's name and lifetime, which is where it belongs anyway.
 */
export function writeLocaleCookie(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_MAX_AGE}; samesite=lax`
}

/** One string in both languages. */
export type LabelSet = { ar: string; en: string }

export type Dictionary = Record<string, LabelSet>

export type Resolved<D extends Dictionary> = { [K in keyof D]: string }

/**
 * Resolve a whole dictionary into the active language.
 *
 * A plain function rather than a hook, because every route file here is a
 * Server Component and a hook cannot be called from one. Client components get
 * their locale from `LocaleProvider` and call this with it.
 */
export function t<D extends Dictionary>(dict: D, locale: Locale): Resolved<D> {
  const out = {} as Resolved<D>
  for (const key of Object.keys(dict) as (keyof D)[]) {
    out[key] = dict[key]![locale]
  }
  return out
}
