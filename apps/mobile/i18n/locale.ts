/**
 * Which language the app renders in — copy only, never layout direction.
 * `app.json` sets `forcesRTL: true` on the expo-localization plugin, so the tree
 * is mirrored on every launch regardless of locale; making direction follow the
 * locale is a native-config change plus a full reload.
 *
 * **The device language is deliberately not consulted.** Reading `getLocales()`
 * let a phone setting decide the identity of an Arabic-first vault, and put
 * English copy inside a layout that is force-mirrored either way. Wassiya is
 * Arabic until its owner says otherwise, and the handset is not its owner.
 */
import type { Locale } from "@workspace/ui-native/lib/labels"

import { DEFAULT_LOCALE } from "@/lib/direction"

export type { Locale }

/**
 * Resolve the active locale from the profile, falling back to Arabic.
 *
 * `users.me().locale` is a BCP 47 tag ("ar-SA"), so only the language subtag
 * is consulted — a Saudi user on `ar-SA` and an Egyptian on `ar-EG` both get
 * Arabic, and region belongs to `country` anyway.
 *
 * The profile field is the ONLY route to the English pass. Nothing writes it
 * yet — a language control belongs to Settings (section ٩), which is not built
 * — so every session currently renders Arabic. That is the intended state, not
 * an oversight: the English strings stay live and typechecked behind a field
 * the backend already accepts, ready for the screen that will set it.
 */
export function resolveLocale(
  profileLocale: string | null | undefined
): Locale {
  if (profileLocale === null || profileLocale === undefined) {
    return DEFAULT_LOCALE
  }
  return profileLocale.toLowerCase().startsWith("en") ? "en" : DEFAULT_LOCALE
}
