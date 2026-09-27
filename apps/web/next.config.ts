import type { NextConfig } from "next"
import { fileURLToPath } from "node:url"

// `NEXT_PUBLIC_*` values are inlined at build time, into the proxy's CSP as
// well as the client. Missing, the build would still pass and ship a client
// that connects to `undefined` — every reader stuck on a placeholder. The
// standalone server never re-reads this file, so runtime is unaffected.
for (const name of ["NEXT_PUBLIC_CONVEX_URL", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"]) {
  if (!process.env[name]) {
    throw new Error(`${name} is not set. It is inlined at build time — see apps/web/.env.example.`)
  }
}

/**
 * Headers every response carries. The Content-Security-Policy is not here: it
 * needs a per-request nonce, so the proxy sets it (`lib/csp.ts`).
 *
 * `Referrer-Policy` matters more than usual: `/case/:id` and `/receive/:token`
 * are capabilities, and a full URL in a `Referer` to another origin would hand
 * one over. `strict-origin-when-cross-origin` sends other origins the origin
 * only.
 */
const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
]

const nextConfig: NextConfig = {
  // `@workspace/crypto` ships TypeScript source with no build step, like the
  // other two — the executor's handover decrypts in the browser.
  transpilePackages: ["@workspace/ui", "@workspace/backend", "@workspace/crypto"],
  // Emit a self-contained server (.next/standalone) for a minimal Docker image.
  output: "standalone",
  // Trace from the monorepo root so workspace deps in ../../node_modules are bundled.
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }]
  },

  /**
   * Retired routes, kept alive because the links that reach this app arrive by
   * **message** — a report's case page, an executor's delivery — and mail sits
   * in an inbox for months. `permanent: false` so a browser never caches a
   * destination that may move again.
   */
  async redirects() {
    return [
      { source: "/box", destination: "/", permanent: false },
      { source: "/claims/new", destination: "/file", permanent: false },
      { source: "/claims", destination: "/", permanent: false },
      { source: "/claims/:id", destination: "/case/:id", permanent: false },
      { source: "/box/:claimId", destination: "/case/:claimId", permanent: false },
      { source: "/case/:claimId/box", destination: "/case/:claimId", permanent: false },
      { source: "/guardian", destination: "/", permanent: false },
      { source: "/guardian/:path*", destination: "/", permanent: false },
    ]
  },
}

export default nextConfig
