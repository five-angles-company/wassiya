"use client"

import { useRouter } from "next/navigation"

import { dirFor, writeLocaleCookie, type Locale } from "@/lib/i18n/locale"

/**
 * The language switch: a form that JavaScript intercepts, not a button that
 * needs it.
 *
 * ## Why this still reaches the server, where the theme switch does not
 *
 * Theme is only CSS, so one class on `<html>` repaints everything for free.
 * Locale is not: `dir`, `lang`, and **every string rendered by a Server
 * Component** come from the server. There is no way to turn this page from
 * Arabic into English without asking the server for it again.
 *
 * What it does not need is a *document* navigation. It used to post and 303
 * back, which tore down and rebuilt everything — a fresh Convex socket with
 * every `useQuery` re-subscribing, re-hydration, and any client state the
 * reader had. `router.refresh()` refetches only the Server Component payload
 * and reconciles it into the tree that is already there: client state survives,
 * the socket survives, scroll survives.
 *
 * ## `dir` and `lang` are set here, not left to the refresh
 *
 * They live on `<html>`, which React reconciles differently from the tree
 * beneath it, so they are set imperatively rather than hoped for. The server
 * still emits both correctly on the next full document — this only covers the
 * refreshed one.
 *
 * ## It still works with JavaScript off
 *
 * The `<form>` is real and its action is real. `preventDefault` runs only once
 * React has hydrated; before that, or with scripting disabled, a click posts to
 * `/api/locale` and the round trip happens exactly as it used to. **This is
 * what the earlier client version got wrong** — it was an `onClick` with no
 * form under it, which cost the sign-in and claim pages the property their own
 * comments promise. A leaf that enhances a real form costs nothing.
 *
 * **Each language is written in its own script, always.** Someone who has landed
 * on the wrong one cannot be expected to recognise "الإنجليزية".
 */
export function LanguageSwitch({
  next,
  here,
  label,
}: {
  /** The language this switch moves to — resolved on the server. */
  next: Locale
  /** Where the no-JS round trip should return to. */
  here: string
  label: string
}) {
  const router = useRouter()

  return (
    <form
      action="/api/locale"
      method="post"
      className="flex"
      onSubmit={(event) => {
        event.preventDefault()
        writeLocaleCookie(next)
        document.documentElement.lang = next
        document.documentElement.dir = dirFor(next)
        router.refresh()
      }}
    >
      <input type="hidden" name="locale" value={next} />
      <input type="hidden" name="redirect_to" value={here} />
      <button
        type="submit"
        lang={next}
        aria-label={label}
        className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {next === "en" ? "EN" : "AR"}
      </button>
    </form>
  )
}
