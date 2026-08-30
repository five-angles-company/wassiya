import { NextResponse, type NextRequest } from "next/server"
import { clerkMiddleware } from "@clerk/nextjs/server"

// Next.js 16 renamed the `middleware` file convention to `proxy` (same
// signature, but the runtime is always Node.js — the edge runtime is gone).
//
// `clerkMiddleware()` only attaches the auth context; it does not gate routes.
// Clerk deprecated matcher-based gating (`createRouteMatcher`) because path
// matching drifts from how Next.js actually routes. Protect resources instead:
//   - pages / layouts / route handlers: `const { isAuthenticated } = await auth()`
//     from "@clerk/nextjs/server", or `await auth.protect()`
//   - data: in the Convex function, via `ctx.auth.getUserIdentity()`
// The language switch is a form POST that has to redirect the reader back to
// where they were. A Server Component cannot read its own URL, so the current
// path is forwarded as a request header — the standard way to get it, and the
// only thing this proxy does beyond attaching Clerk's context.
export default clerkMiddleware((_auth, request: NextRequest) => {
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
