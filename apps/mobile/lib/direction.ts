import { applyLocaleDirection, isRTL } from "@workspace/ui-native/lib/rtl"
import type { Locale } from "@workspace/ui-native/lib/labels"

/** Wassiya is Arabic-first: RTL is the default layout, not an opt-in. */
export const DEFAULT_LOCALE: Locale = "ar"

/**
 * Assert the layout direction for the app's locale.
 *
 * **The real fix is native, not this function.** `app.json` configures
 * `expo-localization` with `{ supportsRTL: true, forcesRTL: true }`, which
 * writes `ExpoLocalization_forcesRTL` into Info.plist and strings.xml. React
 * Native reads those *before the first view is created*, so the app is
 * mirrored from the very first launch of a fresh install.
 *
 * A JS-only `I18nManager.forceRTL()` cannot achieve that: it takes effect only
 * for views created after a full reload, so on first run the tree would render
 * LTR with Arabic text in it, and the user would have to restart the app to
 * see the layout the product is designed for.
 *
 * This call is therefore a **belt-and-braces assertion** for JS contexts the
 * native config does not cover — Expo Go, a stale dev client built before the
 * plugin was added, and web. Returns `true` if it actually had to change
 * anything, which means the native config did not take and the caller is in
 * one of those environments: the layout will be wrong until the app is
 * reloaded, and that is worth surfacing rather than swallowing.
 *
 * Requires a `expo prebuild` + dev-client rebuild to take effect natively.
 */
export function initLayoutDirection(locale: Locale = DEFAULT_LOCALE): boolean {
  return applyLocaleDirection(locale)
}

/** Whether the running app is actually mirrored right now. */
export { isRTL }
