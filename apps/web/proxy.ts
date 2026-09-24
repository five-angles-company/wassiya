import { NextResponse, type NextRequest } from "next/server"
import { clerkMiddleware } from "@clerk/nextjs/server"

import { LOCALE_COOKIE, LOCALE_MAX_AGE } from "@/lib/i18n/locale"
import { THEME_COOKIE, THEME_MAX_AGE } from "@/lib/theme"

// Next.js 16 renamed the `middleware` file convention to `proxy` (same
// signature, but the runtime is always Node.js — the edge runtime is gone).
//
// `clerkMiddleware()` only attaches the auth context; it does not gate routes.
// Clerk deprecated matcher-based gating (`createRouteMatcher`) because path
// matching drifts from how Next.js actually routes. Protect resources instead:
//   - pages / layouts / route handlers: `const { isAuthenticated } = await auth()`
//     from "@clerk/nextjs/server", or `await auth.protect()`
//   - data: in the Convex function, via `ctx.auth.getUserIdentity()`
//
// Beyond Clerk's context this proxy does two things:
//   - **`?lang=ar|en` becomes the locale cookie.** The landing site (another
//     origin, so it cannot set our cookie) carries its reader's language on
//     every link in here. It is a redirect rather than a Set-Cookie on the page
//     itself, because the root layout reads the cookie on this same request and
//     would render the first page in the old language.
//   - **Development only: `?theme=light|dark`** does the same for the theme
//     cookie, so a headless browser can screenshot both themes.
//   - **The current path is forwarded as `x-pathname`**, because the language
//     switch is a form POST that must redirect the reader back, and a Server
//     Component cannot read its own URL.
export default clerkMiddleware((_auth, request: NextRequest) => {
  const lang = request.nextUrl.searchParams.get("lang")
  if (request.method === "GET" && (lang === "ar" || lang === "en")) {
    const target = request.nextUrl.clone()
    target.searchParams.delete("lang")
    const response = NextResponse.redirect(target, 303)
    response.cookies.set(LOCALE_COOKIE, lang, {
      path: "/",
      maxAge: LOCALE_MAX_AGE,
      sameSite: "lax",
    })
    return response
  }

  const theme = request.nextUrl.searchParams.get("theme")
  if (
    process.env.NODE_ENV !== "production" &&
    request.method === "GET" &&
    (theme === "light" || theme === "dark")
  ) {
    const target = request.nextUrl.clone()
    target.searchParams.delete("theme")
    const response = NextResponse.redirect(target, 303)
    response.cookies.set(THEME_COOKIE, theme, {
      path: "/",
      maxAge: THEME_MAX_AGE,
      sameSite: "lax",
    })
    return response
  }

  const headers = new Headers(request.headers)
  headers.set("x-pathname", request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.next({ request: { headers } })
})

export const config = {
  matcher: [
    // The `\.` is a literal dot in the *regex*, so it needs two
    // backslashes in a JS string. Written with one it was a plain `.` — an
    // any-character class — which quietly made the static-asset skip match far
    // more paths than intended.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    // Clerk's own handshake/proxy endpoints.
    "/__clerk/(.*)",
  ],
}
