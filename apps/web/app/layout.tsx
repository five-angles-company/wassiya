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

/** Latin face, bound to `--font-latin` so the two stacks can sit side by side. */
const inter = Inter({ subsets: ["latin"], variable: "--font-latin" })

const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

/**
 * The Arabic faces, loaded at the root rather than in the claim group.
 *
 * They used to live one layer down, when the funnel was the only Arabic thing
 * here and the rest of the app was English. Both halves of that are now false:
 * the whole site follows the reader's locale, and the guardian screens are a
 * second Arabic-first surface. Inter has no Arabic glyphs at all, so without
 * these every Arabic string falls back to whatever the OS happens to have.
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

/**
 * The site shell.
 *
 * ## Why this is `async`
 *
 * `dir` and `lang` have to be right in the very first byte of HTML. Reading the
 * locale cookie here — rather than in a client effect — is what buys that: a
 * page that renders LTR and then flips is worse than one that is simply
 * English. The funnel's readers arrive in the worst week of their lives; the
 * layout jumping under them is not a cost worth paying for a cached response.
 *
 * The price is that `cookies()` is a Request API, so every route renders
 * dynamically — `/claim` included, which was statically generated. It stays
 * indexable, and `apps/landing` is the static marketing site; this one is a
 * utility reached from a link.
 *
 * ## `dir` moved up from the claim group
 *
 * It used to sit on a nested `<div dir="rtl">`, because the root was
 * English-only and the funnel was the exception. Now that the locale is a
 * site-wide fact, `dir` belongs where the browser expects it — on `<html>`,
 * where it also reaches portals, scrollbars and form controls that a nested
 * subtree never touched.
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
        // `.wassiya` opts the whole site into the Organic palette. It was
        // scoped to the funnel while the root was stock shadcn; there is no
        // longer a screen here that wants the stock one.
        "wassiya font-sans antialiased",
        inter.variable,
        fontMono.variable,
        plexArabic.variable,
        cairo.variable
      )}
      style={
        {
          "--font-sans": arabic
            ? "var(--font-plex-arabic)"
            : "var(--font-latin)",
          "--font-heading": arabic ? "var(--font-cairo)" : "var(--font-latin)",
        } as CSSProperties
      }
    >
      <body>
        {/* ClerkProvider must wrap ConvexClientProvider — Convex reads Clerk's
            context to get its access token. */}
        {/* Clerk's card ships white-and-blue, which on a sand ground reads as
            a different product's login bolted onto this one. These map its
            surfaces onto the Organic tokens; the pill radius matches every
            other button in the funnel. */}
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#c67139",
              colorBackground: "#ebddc5",
              colorForeground: "#201e1d",
              colorMutedForeground: "#82796a",
              colorInput: "#f5ead8",
              colorInputForeground: "#201e1d",
              borderRadius: "0.75rem",
              fontFamily: "var(--font-sans)",
            },
            elements: {
              card: "shadow-none border border-[color-mix(in_srgb,#201e1d_16%,transparent)]",
              formButtonPrimary: "rounded-full text-[15px] font-semibold",
            },
          }}
        >
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
