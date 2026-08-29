/**
 * ٧ — the heir-claim funnel.
 *
 * Its own route group because it is its own product: *"a public web funnel
 * opened from a link, by someone who has never used Wassiya and never will
 * again."* No vault chrome, no tabs, nothing to install and nothing to
 * remember. The board is explicit that the landing must work "at 320px and on
 * an old browser", reached "in the worst week of someone's life", with no
 * app-store detour — and, for its first three screens, unauthenticated.
 *
 * ## What this used to carry, and why it no longer does
 *
 * It owned `dir="rtl"`, `lang="ar"`, the `.wassiya` palette and the two Arabic
 * faces, because the root layout was English-only and this funnel was the
 * exception to it. All four moved up when the site gained a locale: `dir` now
 * sits on `<html>` where the browser expects it, and the palette and faces are
 * site-wide because the guardian screens are a second Arabic-first surface.
 *
 * What is left is the group itself — the boundary that keeps this funnel free
 * of the chrome the rest of the app will grow.
 */
export default function ClaimLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen">{children}</div>
}
