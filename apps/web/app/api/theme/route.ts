import { NextResponse, type NextRequest } from "next/server"

import { safePath } from "@/lib/safe-path"
import { resolveTheme, THEME_COOKIE, THEME_MAX_AGE } from "@/lib/theme"

/**
 * The colour-scheme switch, as a plain form POST — the same shape as
 * `/api/locale`, and for the same reason.
 *
 * A `useTheme()` hook would drag a hydration boundary into the bar that every
 * page renders, including the sign-in and claim pages whose own doc comments
 * promise they work with JavaScript disabled. It would also flash: the class
 * would land after first paint, so a reader who chose dark would watch the page
 * render light and then flip.
 *
 * Posting here sets the cookie and 303s back, so `<html>` carries the right
 * class in the first byte of the next document.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData()
  const theme = resolveTheme(String(form.get("theme") ?? ""))

  // Same-origin only. A hidden field is user input like any other, and an
  // absolute URL here would make the theme switch an open redirect — see the
  // identical note in `/api/locale`.
  const to = safePath(String(form.get("redirect_to") ?? "/"))

  const response = NextResponse.redirect(new URL(to, request.url), {
    // 303 so the browser follows with GET rather than re-posting.
    status: 303,
  })
  response.cookies.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: THEME_MAX_AGE,
    sameSite: "lax",
  })
  return response
}
