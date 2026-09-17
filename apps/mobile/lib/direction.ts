import { applyLocaleDirection, isRTL } from "@workspace/ui-native/lib/rtl"
import type { Locale } from "@workspace/ui-native/lib/labels"

/** Wassiya is Arabic-first: RTL is the default layout, not an opt-in. */
export const DEFAULT_LOCALE: Locale = "ar"

/**
 * Assert the layout direction for the app's locale.
 *
 * **The real fix is native, not this function.** `app.json` configures
 * `expo-localization` with `{ supportsRTL: true, forcesRTL: true }`, which React
 * Native reads *before the first view is created*, so the app is mirrored from
 * the very first launch of a fresh install. A JS-only `I18nManager.forceRTL()`
 * takes effect only for views created after a full reload, so on first run the
 * tree would render LTR with Arabic text in it.
 *
 * This call is a belt-and-braces assertion for JS contexts the native config
 * does not cover — Expo Go, a stale dev client, and web. It returns `true` if it
 * actually had to change anything, which means the native config did not take
 * and the layout will be wrong until the app is reloaded — worth surfacing
 * rather than swallowing.
 *
 * Requires `expo prebuild` + a dev-client rebuild to take effect natively.
 */
export function initLayoutDirection(locale: Locale = DEFAULT_LOCALE): boolean {
  return applyLocaleDirection(locale)
}

/** Whether the running app is actually mirrored right now. */
export { isRTL }
