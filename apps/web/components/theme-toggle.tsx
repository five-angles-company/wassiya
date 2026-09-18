import { headers } from "next/headers"

import { ThemeSwitch } from "@/components/theme-switch"
import { t, type Locale } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import type { Theme } from "@/lib/theme"

/**
 * Light or dark.
 *
 * A Server Component that resolves the labels and the return path, wrapping one
 * small Client Component that does the switching — see `theme-switch.tsx` for
 * why the interaction is client-side and why the form underneath it is not
 * decorative.
 *
 * The boundary stops at that button. It is a leaf, so no page or layout becomes
 * a Client Component because of it, and the dictionary stays on the server.
 *
 * Icon only. It sits beside the language switch, which carries a word already;
 * two labelled pills in a corner that holds three controls is most of what
 * makes chrome look crowded. The icon shows **what you will get**, not what you
 * are in — a moon while light, a sun while dark.
 */
export async function ThemeToggle({
  theme,
  locale,
}: {
  theme: Theme
  locale: Locale
}) {
  const labels = t(COMMON, locale)

  // Only the no-JS path uses this; the enhanced one never leaves the page.
  // `x-pathname` is set by `proxy.ts` — without it the switch still works and
  // simply lands on the home page.
  const here = (await headers()).get("x-pathname") ?? "/"

  return (
    <ThemeSwitch
      initial={theme}
      here={here}
      darkLabel={labels.themeDark}
      lightLabel={labels.themeLight}
    />
  )
}
