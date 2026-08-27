import type { CSSProperties } from "react"
import { cookies } from "next/headers"
import {
  Cairo,
  Geist_Mono,
  IBM_Plex_Sans_Arabic,
  Inter,
} from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"

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
const inter = Inter({ subsets: ["latin"], variable: "--font-latin" })

const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

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
        {/* ClerkProvider must wrap ConvexClientProvider — Convex reads Clerk's
            context to get its access token. */}
        <ClerkProvider>
          <ThemeProvider>
            <ConvexClientProvider>
              <LocaleProvider locale={locale}>{children}</LocaleProvider>
            </ConvexClientProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
