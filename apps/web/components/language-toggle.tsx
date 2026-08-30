import { headers } from "next/headers"

import { t, type Locale } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * The language switch — a form, not a button with an `onClick`.
 *
 * A Server Component on purpose. The previous version was a Client Component
 * calling `router.refresh()`, which put a hydration boundary into the claim
 * landing page's header and quietly cost that page the property its own doc
 * comment still promised: that it works with JavaScript disabled. The board
 * asks for that explicitly — this funnel is reached *"in the worst week of
 * someone's life"*, on *"an old browser"*.
 *
 * Posting to `/api/locale` sets the cookie and 303s back, so the next document
 * arrives with `dir` and `lang` already right. No flash, no client state, and
 * nothing to hydrate.
 *
 * Each language is written in its own script, always. Someone who has landed on
 * the wrong one cannot be expected to recognise "الإنجليزية".
 */
export async function LanguageToggle({ locale }: { locale: Locale }) {
  const labels = t(COMMON, locale)
  const next: Locale = locale === "ar" ? "en" : "ar"

  // Where to come back to. `x-pathname` is set by `proxy.ts`; without it the
  // switch still works and simply lands on the home page.
  const here = (await headers()).get("x-pathname") ?? "/"

  return (
    <form action="/api/locale" method="post" className="flex">
      <input type="hidden" name="locale" value={next} />
      <input type="hidden" name="redirect_to" value={here} />
      <button
        type="submit"
        lang={next}
        aria-label={labels.language}
        className="text-sand-700 hover:text-terracotta-700 hover:bg-sand-100 h-9 rounded-full px-3 text-[13.5px] font-semibold transition-colors"
      >
        {next === "en" ? "English" : "العربية"}
      </button>
    </form>
  )
}
