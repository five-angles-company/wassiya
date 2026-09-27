/**
 * The Content-Security-Policy, as additions to the one Clerk's middleware
 * builds (`clerkMiddleware(…, { contentSecurityPolicy })`).
 *
 * ⚠️ This page decrypts a dead person's secrets in the tab, so an injected
 * script is the one attack that walks past the whole zero-knowledge design.
 * `strict: true` makes Clerk mint a per-request nonce and set `'strict-dynamic'`,
 * so only scripts Next.js and Clerk emit with that nonce — and what they load —
 * can run. Clerk's defaults already cover its own hosts, Turnstile and avatars;
 * what is added here is Convex (queries over a WebSocket, files over HTTPS),
 * framing, and the plugin and base-URL holes.
 *
 * `ClerkProvider` must be `dynamic` in the root layout, or Clerk's own script
 * tags render without the nonce and are blocked.
 */
function convexOrigins(): string[] {
  const raw = process.env.NEXT_PUBLIC_CONVEX_URL
  if (raw === undefined || raw === "") return []
  const { host } = new URL(raw)
  return [`https://${host}`, `wss://${host}`]
}

export const CONTENT_SECURITY_POLICY = {
  strict: true,
  directives: {
    "connect-src": convexOrigins(),
    "img-src": ["data:", "blob:"],
    "media-src": ["self", "blob:"],
    "object-src": ["none"],
    "base-uri": ["self"],
    "frame-ancestors": ["none"],
  },
}
