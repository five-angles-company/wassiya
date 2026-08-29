"use client"

import { useRouter } from "next/navigation"

import { useLocale } from "@/components/locale-provider"
import { t, writeLocaleCookie, type Locale } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * The one control that changes the language.
 *
 * A cookie write plus `router.refresh()`, not client state: `dir` and `lang`
 * live on `<html>`, which only the server emits, so the switch has to go back
 * through the server to take effect. `refresh()` re-renders the route tree in
 * place, keeping form input and scroll position — which matters here, because
 * someone may switch language halfway through filling in a death certificate.
 *
 * Each language is written in its own script, always. A reader who has landed
 * on the wrong one cannot be expected to recognise "الإنجليزية".
 */
export function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()
  const labels = t(COMMON, locale)

  const next: Locale = locale === "ar" ? "en" : "ar"

  return (
    <button
      type="button"
      lang={next}
      aria-label={labels.language}
      onClick={() => {
        writeLocaleCookie(next)
        router.refresh()
      }}
      className="text-sand-600 hover:text-terracotta-700 text-[13.5px] underline-offset-4 hover:underline"
    >
      {next === "en" ? "English" : "العربية"}
    </button>
  )
}
