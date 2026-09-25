import type { NextConfig } from "next"
import { fileURLToPath } from "node:url"

const nextConfig: NextConfig = {
  // `@workspace/crypto` ships TypeScript source with no build step, like the
  // other two — the heir box decrypts in the browser.
  transpilePackages: ["@workspace/ui", "@workspace/backend", "@workspace/crypto"],
  // Emit a self-contained server (.next/standalone) for a minimal Docker image.
  output: "standalone",
  // Trace from the monorepo root so workspace deps in ../../node_modules are bundled.
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),

  /**
   * Where the old routes went.
   *
   * The app is being reshaped from a set of destinations into one case, so URLs
   * are moving. These are `permanent: false` on purpose: they are internal
   * tidiness during a reshape, not a public contract being retired, and a 308
   * is cached by browsers in a way that is painful to take back mid-rework.
   *
   * They matter more than usual here because the two links that reach this app
   * arrive by **message** — a report's case page and an heir's delivery — and mail
   * sits in an inbox for months. A link sent today must still work after the
   * route under it moves.
   */
  async redirects() {
    return [
      { source: "/box", destination: "/", permanent: false },
      { source: "/claims/new", destination: "/file", permanent: false },
      // `/` is the list now — with one case it goes straight into it, with
      // several it *is* the list. A separate reports page was a second place to
      // find the same rows.
      { source: "/claims", destination: "/", permanent: false },
      { source: "/claims/:id", destination: "/case/:id", permanent: false },
      // The box moved behind a delivery, and a reporter never opens one — the
      // case page says what happened instead.
      {
        source: "/box/:claimId",
        destination: "/case/:claimId",
        permanent: false,
      },
      {
        source: "/case/:claimId/box",
        destination: "/case/:claimId",
        permanent: false,
      },
      // Guardians were removed; an old invitation or duty link lands at home.
      { source: "/guardian", destination: "/", permanent: false },
      { source: "/guardian/:path*", destination: "/", permanent: false },
    ]
  },
}

export default nextConfig
