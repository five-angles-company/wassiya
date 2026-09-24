"use client"

import { useState } from "react"
import { MoonIcon, SunIcon } from "lucide-react"

import { applyTheme, type Theme } from "@/lib/theme"

/**
 * The switch itself: a form that JavaScript intercepts, not a button that needs
 * it.
 *
 * ## Why it does not navigate
 *
 * It used to post and 303 back, like the language switch. That is right for
 * locale — `dir`, `lang` and every server-rendered string change, so the
 * document genuinely has to be fetched again. **Theme is only CSS.** One class
 * on `<html>` repaints the whole app for free, and paying for a round trip to
 * do it cost a full re-render, a fresh Convex socket with every `useQuery` on
 * the page re-subscribing, and — the part that was a bug rather than a cost —
 * any client state the reader had: three typed fields on the filing form, a
 * half-typed report, a chosen certificate.
 *
 * ## It still works with JavaScript off
 *
 * The `<form>` is real and its action is real. `preventDefault` only runs when
 * React has hydrated; before that, or with scripting disabled, a click posts to
 * `/api/theme` and the server round trip happens exactly as it used to. The
 * enhancement is the interception, not the control.
 *
 * ## The cookie is still the source of truth for first paint
 *
 * `applyTheme` writes it, which keeps `app/layout.tsx` able to stamp `.dark`
 * on `<html>` server-side on the next document — that is what stops the flash.
 */
export function ThemeSwitch({
  initial,
  here,
  darkLabel,
  lightLabel,
}: {
  initial: Theme
  /** Where the no-JS round trip should return to. */
  here: string
  darkLabel: string
  lightLabel: string
}) {
  const [theme, setTheme] = useState<Theme>(initial)
  const next: Theme = theme === "dark" ? "light" : "dark"
  const Icon = next === "dark" ? MoonIcon : SunIcon

  return (
    <form
      action="/api/theme"
      method="post"
      className="flex"
      onSubmit={(event) => {
        event.preventDefault()
        applyTheme(next)
        setTheme(next)
      }}
    >
      <input type="hidden" name="theme" value={next} />
      <input type="hidden" name="redirect_to" value={here} />
      <button
        type="submit"
        aria-label={next === "dark" ? darkLabel : lightLabel}
        className="text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] grid size-10 shrink-0 place-items-center rounded-full transition-colors"
      >
        <Icon className="size-[18px]" strokeWidth={2.2} aria-hidden />
      </button>
    </form>
  )
}
