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
export default clerkMiddleware()

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    // Clerk's own handshake/proxy endpoints.
    "/__clerk/(.*)",
  ],
}
