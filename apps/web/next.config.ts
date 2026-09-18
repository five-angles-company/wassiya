import type { NextConfig } from "next"
import { fileURLToPath } from "node:url"

const nextConfig: NextConfig = {
  // `@workspace/crypto` ships TypeScript source with no build step, like the
  // other two — the heir box opens the release bundle in the browser.
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
   * arrive by **email** — a guardian's invitation and an heir's box — and mail
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
      // 🚨 **`/guardian/key` is a real route again, so there is no redirect here.**
      // It was folded into the guardian standing page for a good reason —
      // "somebody checking their sheet should not have to discharge a duty first
      // to reach it" — and the fold did not deliver it: the page it folded into
      // was itself reachable only from `case-router`, on the one row where a
      // guardian has *nothing* waiting. So the key became unreachable in exactly
      // the week it matters, which is the opposite of what the fold intended.
      //
      // The key is its own page now, reached from the account menu, which is what
      // that comment was asking for. ⚠️ **A config redirect runs before routing**,
      // so leaving this line in would have shadowed the new page silently — the
      // route existed, typechecked and served a 307 to somewhere else.
      {
        source: "/box/:claimId",
        destination: "/case/:claimId/box",
        permanent: false,
      },
    ]
  },
}

export default nextConfig
