import { Cairo, IBM_Plex_Sans_Arabic } from "next/font/google"

/**
 * ٧ — the heir-claim funnel.
 *
 * Its own route group because it is its own product: *"a public web funnel
 * opened from a link, by someone who has never used Wassiya and never will
 * again."* No vault chrome, no tabs, nothing to install and nothing to
 * remember.
 *
 * ## Why this layout exists rather than reusing the root
 *
 * The root layout is `lang="en"`, Latin-font, and wraps everything in Clerk and
 * Convex providers. This funnel is Arabic-first, right-to-left, and — for its
 * first three screens — **unauthenticated by design**. The board is explicit
 * that the landing must work "at 320px and on an old browser", reached "in the
 * worst week of someone's life", with no app-store detour.
 *
 * `.wassiya` is the opt-in that swaps the stock shadcn palette for the Organic
 * one; see `packages/ui/src/styles/globals.css`. Scoped rather than global
 * because `apps/admin` shares that stylesheet.
 */
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
})

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-arabic",
  display: "swap",
})

export default function ClaimLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      // `dir` on the subtree rather than on `<html>`: the root layout serves the
      // rest of the web app, which is LTR. A nested `dir` is the standard way to
      // mix directions in one document and is what makes logical CSS properties
      // (ms-*, pe-*, start-*) resolve correctly inside here.
      dir="rtl"
      lang="ar"
      className={`wassiya min-h-screen ${cairo.variable} ${plexArabic.variable}`}
    >
      {children}
    </div>
  )
}
