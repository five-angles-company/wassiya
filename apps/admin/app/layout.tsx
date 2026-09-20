import type { CSSProperties } from "react"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import {
  Cairo,
  Geist_Mono,
  IBM_Plex_Sans_Arabic,
  Inter,
} from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import { ConvexClientProvider } from "@/components/convex-client-provider"
import { LocaleProvider } from "@/components/locale-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { dirFor, LOCALE_COOKIE, resolveLocale } from "@/lib/i18n/locale"

/**
 * Latin face. Bound to `--font-latin` rather than `--font-sans` so the two
 * language stacks can be declared side by side and chosen below — see the
 * inline custom properties on `<html>`.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
  // Not preloaded: the console's default locale is Arabic, so the Latin stack
  // is the exception rather than the rule. Preloading all four families cost
  // six font files on every first paint, of which three were never drawn.
  // English readers fetch these when the page asks for them, and `swap` means
  // text is visible throughout.
  preload: false,
  display: "swap",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  // A handful of spans — an audit event name, a permission key. Never worth a
  // blocking preload.
  preload: false,
  display: "swap",
})

/**
 * Arabic body and heading faces, loaded the way `apps/web`'s claim funnel loads
 * them. They are not decoration: Inter has no Arabic glyphs at all, so without
 * these every Arabic string in the console falls back to whatever the OS
 * happens to have.
 */
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-arabic",
  display: "swap",
})

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
})

/**
 * ⚠️ **`noindex` is not an oversight, and it is not negotiable.** This console
 * reads death reports, heir records and identity decisions. A crawler reaching
 * it is a leak even if every page refuses without a session, because the URL
 * shapes alone describe the product's internals. Lighthouse's SEO category will
 * always report "blocked from indexing" as a failure here; that is the audit
 * being wrong about what this page is for.
 *
 * The title is load-bearing for a different reason: without it the browser tab,
 * the history entry and every screen reader announce "localhost".
 */
export const metadata: Metadata = {
  title: { default: "وصيّة — لوحة الإدارة", template: "%s · وصيّة" },
  description:
    "لوحة إدارة وصيّة: مراجعة بلاغات الوفاة، والتحقق من الهوية، وتسليم الورثة.",
  robots: { index: false, follow: false, nocache: true },
  // The console is not a web page anybody shares; an icon is all it needs.
  applicationName: "Wassiya",
}

/**
 * Clerk's frontend API, derived from the publishable key.
 *
 * The key is `pk_<env>_<base64 host>`, which is how Clerk's own SDK finds the
 * host — so reading it here introduces no new source of truth. Worth the two
 * lines: sign-in blocks on a script from that origin, and the connection is
 * otherwise not opened until the bundle that needs it has already parsed.
 */
function clerkOrigin(): string | null {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""
  const encoded = key.split("_")[2]
  if (encoded === undefined || encoded === "") return null
  try {
    const host = Buffer.from(encoded, "base64")
      .toString("utf8")
      .replace("$", "")
    return host === "" ? null : `https://${host}`
  } catch {
    return null
  }
}

/**
 * The console shell.
 *
 * ## Why this layout is `async`
 *
 * `dir` and `lang` have to be correct in the very first byte of HTML. Reading
 * the locale cookie here — rather than in a client effect — is what buys that:
 * an RTL console that renders LTR and then flips is worse than one that is
 * simply English.
 *
 * The cost is that `cookies()` is a Request API, so every route under this
 * layout renders dynamically, `/sign-in` included. For an internal console with
 * no cacheable pages that is the right trade.
 *
 * ## Fonts are swapped by custom property, not by a palette class
 *
 * `globals.css` maps the Tailwind theme keys `--font-sans` and `--font-heading`
 * onto CSS custom properties, so pointing those at the Arabic stack is enough
 * to reface the whole console. The alternative — the `.wassiya` class — would
 * also drag in the sand-and-terracotta palette, and that stylesheet says in as
 * many words that `apps/admin` must keep the stock shadcn one. It also has no
 * dark variant, and this console has a dark mode.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const arabic = locale === "ar"
  const clerk = clerkOrigin()

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      suppressHydrationWarning
      className={cn(
        // The Organic palette, in both themes. `wassiya-admin` rather than
        // `wassiya`: the funnel's class is light-only and carries no sidebar
        // tokens — see the block's own comment in globals.css.
        "wassiya-admin font-sans antialiased",
        inter.variable,
        fontMono.variable,
        plexArabic.variable,
        cairo.variable
      )}
      style={
        {
          "--font-sans": arabic ? "var(--font-arabic)" : "var(--font-latin)",
          "--font-heading": arabic ? "var(--font-cairo)" : "var(--font-latin)",
        } as CSSProperties
      }
    >
      <body>
        {/* Rendered here rather than in a hand-written `<head>`: React hoists
            `link` and `meta` into the document head on its own, and a manual
            `<head>` element in a layout suppresses the Metadata API — which
            silently cost the document its `<title>`. */}
        {clerk !== null && (
          <>
            <link rel="preconnect" href={clerk} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={clerk} />
          </>
        )}
        {/* Avatars in the header's account button. */}
        <link rel="preconnect" href="https://img.clerk.com" />

        {/* Outermost because it is orthogonal to every other provider: it reads
            the App Router's own hooks and patches `window.history`, and knows
            nothing about auth or locale. Unlike the Clerk/Convex pair below
            there is no ordering constraint to get wrong. */}
        <NuqsAdapter>
          {/* ClerkProvider must wrap ConvexClientProvider — Convex reads
              Clerk's context to get its access token.

              `telemetry` off: a console that reads death reports has no
              business opening a connection to a third-party analytics host on
              every load, and it was a request on the critical path for
              something nobody here reads. */}
          <ClerkProvider telemetry={false}>
            <ThemeProvider>
              <ConvexClientProvider>
                <LocaleProvider locale={locale}>{children}</LocaleProvider>
              </ConvexClientProvider>
            </ThemeProvider>
          </ClerkProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}
