/**
 * The console's locale, and the one place that decides what "Arabic" means for
 * layout.
 *
 * Unlike the mobile app — where the locale rides on the signed-in profile
 * (`users.me().locale`) — the console reads it from a cookie. Two reasons, and
 * both are about who is looking at the screen:
 *
 *  1. **The operator is not the owner.** A reviewer's reading language has
 *     nothing to do with any vault owner's stored preference, and the console
 *     shows many owners at once.
 *  2. **The server has to know before it renders.** `dir` belongs on `<html>`,
 *     which is emitted by a Server Component. A cookie is readable there; a
 *     `localStorage` value is not, and reading one after hydration means the
 *     first paint is laid out the wrong way round and then jumps.
 *
 * There is still no i18n library here. This is the same thin catalogue the
 * mobile app uses (`apps/mobile/i18n/`), so if one ever lands the swap is
 * mechanical in both places at once.
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
 * should render the default console, not an error page.
 */
export function resolveLocale(value: string | undefined | null): Locale {
  return value === "en" ? "en" : DEFAULT_LOCALE
}

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr"
}

/**
 * Persist the operator's choice. Browser-only — `document` does not exist on
 * the server, and nothing server-side should be writing this.
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

/** One string in both languages. Mirrors `ui-native`'s `LabelSet`. */
export type LabelSet = { ar: string; en: string }

export type Dictionary = Record<string, LabelSet>

export type Resolved<D extends Dictionary> = { [K in keyof D]: string }

/**
 * Resolve a whole dictionary into the active language.
 *
 * A plain function rather than a hook, because roughly half the console is
 * Server Components and a hook cannot be called from one. Client components get
 * their locale from `LocaleProvider` and call this with it.
 */
export function t<D extends Dictionary>(dict: D, locale: Locale): Resolved<D> {
  const out = {} as Resolved<D>
  for (const key of Object.keys(dict) as (keyof D)[]) {
    out[key] = dict[key]![locale]
  }
  return out
}
