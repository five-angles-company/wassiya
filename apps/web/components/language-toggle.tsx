import { headers } from "next/headers"

import { LanguageSwitch } from "@/components/language-switch"
import { t, type Locale } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * The language switch.
 *
 * A Server Component that resolves the label and the return path, wrapping one
 * small Client Component that does the switching — see `language-switch.tsx`
 * for why the interaction is client-side and why the form underneath it is not
 * decorative.
 *
 * The boundary stops at that button. It is a leaf, so no page or layout becomes
 * a Client Component because of it, and the dictionary stays on the server.
 *
 * It is a ghost pill at the same height as the theme switch beside it, with a
 * globe — as a bare word it read as leftover text rather than something
 * pressable, and matching footprints are most of what makes a controls cluster
 * look deliberate.
 */
export async function LanguageToggle({ locale }: { locale: Locale }) {
  const labels = t(COMMON, locale)
  const next: Locale = locale === "ar" ? "en" : "ar"

  // Only the no-JS path uses this; the enhanced one never leaves the page.
  // `x-pathname` is set by `proxy.ts` — without it the switch still works and
  // simply lands on the home page.
  const here = (await headers()).get("x-pathname") ?? "/"

  return <LanguageSwitch next={next} here={here} label={labels.language} />
}
