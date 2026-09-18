import { NextResponse, type NextRequest } from "next/server"

import { LOCALE_COOKIE, LOCALE_MAX_AGE, resolveLocale } from "@/lib/i18n/locale"
import { safePath } from "@/lib/safe-path"

/**
 * The language switch, as a plain form POST.
 *
 * It used to be an `onClick` on a Client Component, which quietly cost the
 * claim landing page the one property it has to keep: *"works at
 * 320px and on an old browser"*, *"renders and works with JS disabled"*. The
 * page itself is a Server Component, but hosting the toggle in its header
 * dragged a hydration boundary onto it.
 *
 * A form posting here needs no JavaScript at all. The response is a redirect
 * back to wherever the reader was, carrying the new cookie — so `dir` and
 * `lang` are correct in the first byte of the next document, which is the whole
 * reason the locale lives in a cookie rather than in client state.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData()
  const locale = resolveLocale(String(form.get("locale") ?? ""))

  // Only ever a same-origin path. `redirect_to` arrives from a hidden field in
  // our own form, but a hidden field is user input like any other, and an
  // absolute URL here would turn the language switch into an open redirect.
  // `safePath` is shared with sign-in's `redirect_url`, which is the identical
  // problem written as a query parameter.
  const to = safePath(String(form.get("redirect_to") ?? "/"))

  const response = NextResponse.redirect(new URL(to, request.url), {
    // 303: the browser must follow with GET. Without it the redirect inherits
    // POST and the destination page is asked to handle a method it has no
    // handler for.
    status: 303,
  })
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_MAX_AGE,
    sameSite: "lax",
  })
  return response
}
