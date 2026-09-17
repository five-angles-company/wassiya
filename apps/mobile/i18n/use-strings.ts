/**
 * Screen copy, in the active locale. No i18n library yet — this is the thin
 * catalogue layer the `@workspace/ui-native` README anticipates, so primitives
 * keep their `labels` prop and the eventual swap stays mechanical.
 *
 * ```ts
 * const { t, locale } = useStrings("setup/explainer")
 * <Text variant="screenTitle">{t.title}</Text>
 * ```
 *
 * Numerals are deliberately not handled here. Arabic renders Eastern
 * Arabic-Indic digits, but OTP codes, recovery codes and email addresses stay
 * Latin inside an LTR isolate — a per-value decision, not a per-string one. Use
 * `fmtNum` / `fmtDate` / `isolateLtr` at the call site.
 */
import { useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Locale, ResolvedLabels } from "@workspace/ui-native/lib/labels"

import { resolveLocale } from "@/i18n/locale"
import { SCREEN_STRINGS, type ScreenName } from "@/i18n/strings"

/**
 * The active locale, from the signed-in profile when there is one.
 *
 * `users.me` returns null while signed out — the welcome and auth screens —
 * and `resolveLocale` falls back to the device language there.
 */
export function useLocale(): Locale {
  const me = useQuery(api.users.me)
  return resolveLocale(me?.locale)
}

type Keys<S extends ScreenName> = keyof (typeof SCREEN_STRINGS)[S] & string

export function useStrings<S extends ScreenName>(
  screen: S
): { t: ResolvedLabels<Keys<S>>; locale: Locale } {
  const locale = useLocale()
  const t = useMemo(() => {
    const table = SCREEN_STRINGS[screen] as Record<
      string,
      { ar: string; en: string }
    >
    const out: Record<string, string> = {}
    for (const key of Object.keys(table)) out[key] = table[key]![locale]
    return out as ResolvedLabels<Keys<S>>
  }, [screen, locale])

  return { t, locale }
}
