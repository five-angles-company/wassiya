export type Theme = "light" | "dark"

export const THEME_COOKIE = "wassiya_theme"
/** A year, like the locale cookie. A colour scheme is not a session. */
export const THEME_MAX_AGE = 60 * 60 * 24 * 365

/**
 * The reader's colour scheme.
 *
 * ⚠️ **Light unless they said otherwise — `prefers-color-scheme` is not
 * consulted.** This funnel is opened in the worst week of someone's life, and
 * repainting it because their laptop is in dark mode would hand an untested
 * scheme to a reader who never asked. Dark is reachable, and only by asking.
 *
 * It lives in a cookie rather than in client state because the class has to be
 * on `<html>` in the first byte of the document, or the page renders light and
 * flips under the reader.
 *
 * **No server imports here**, so the switch — a Client Component — can read the
 * cookie's name and lifetime without dragging `next/headers` into the bundle.
 * `getTheme` lives in `lib/theme-server.ts` for the same reason `getLocale`
 * lives apart from `lib/i18n/locale.ts`.
 */
export function resolveTheme(value: string | undefined | null): Theme {
  return value === "dark" ? "dark" : "light"
}

/**
 * Repaint now and remember the choice. Browser-only.
 *
 * A plain module function rather than inline in the switch, for the reason
 * `writeLocaleCookie` gives: the React compiler reads an assignment to
 * `document.cookie` inside a component as mutating a value it holds immutable.
 * Both writes belong next to the cookie's name and lifetime anyway — a cookie
 * written two ways with two lifetimes is a bug that surfaces a year later.
 */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${THEME_MAX_AGE}; samesite=lax`
}
