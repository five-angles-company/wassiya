import { headers } from "next/headers"
import { LanguagesIcon } from "lucide-react"

import { t, type Locale } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * The language switch — a form, not a button with an `onClick`.
 *
 * A Server Component on purpose. The previous version was a Client Component
 * calling `router.refresh()`, which dragged a hydration boundary into the bar
 * and cost the sign-in page the property its own doc comment promised: that it
 * works with JavaScript disabled, on an old browser, in the worst week of
 * someone's life.
 *
 * Posting to `/api/locale` sets the cookie and 303s back, so the next document
 * arrives with `dir` and `lang` already right. No flash, no client state,
 * nothing to hydrate.
 *
 * ## It looks like a control now
 *
 * It rendered as a bare word in the bar — no border, no icon, no hit area —
 * which read as leftover text rather than something you could press. It is a
 * ghost pill at the same height as the bell beside it, with the globe that
 * makes it legible before the word is read; matching footprints are most of
 * what makes a controls cluster look deliberate rather than assembled.
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
        className="text-sand-700 hover:text-foreground hover:bg-sand-100 inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold transition-colors"
      >
        <LanguagesIcon className="size-4 shrink-0" strokeWidth={2.2} aria-hidden />
        {next === "en" ? "English" : "العربية"}
      </button>
    </form>
  )
}
