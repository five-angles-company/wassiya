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
import { clerkLocalization } from "@/lib/clerk-localization"
import { dirFor, LOCALE_COOKIE, resolveLocale } from "@/lib/i18n/locale"
import { getTheme } from "@/lib/theme-server"

/** Latin face, bound to `--font-latin` so the two stacks can sit side by side. */
const inter = Inter({ subsets: ["latin"], variable: "--font-latin" })

const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

/**
 * The Arabic faces, loaded at the root rather than in the claim group.
 *
 * They used to live one layer down, when the funnel was the only Arabic thing
 * here and the rest of the app was English. Both halves of that are now false:
 * the whole site follows the reader's locale, and the delivery screens are a
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
 * The site shell, and `async` because `dir` and `lang` have to be right in the
 * very first byte of HTML. Reading the locale cookie here rather than in a
 * client effect is what buys that: a page that renders LTR and then flips is
 * worse than one that is simply English, and the funnel's readers arrive in the
 * worst week of their lives.
 *
 * The price is that `cookies()` is a Request API, so every route renders
 * dynamically, `/claim` included. It stays indexable, and `apps/landing` is the
 * static marketing site.
 *
 * `dir` belongs on `<html>` rather than a nested `<div dir="rtl">`, where it
 * also reaches portals, scrollbars and form controls that a nested subtree never
 * touched.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const theme = await getTheme()
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
        // Read from a cookie on the server, so the class is present in the
        // first byte and nothing flips after paint. Never from
        // `prefers-color-scheme` — see `lib/theme.ts`.
        theme === "dark" && "dark",
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
            other button in the funnel.

            This themes what Clerk still renders — sign-in, sign-up, and the
            profile modal. The avatar and its menu are `components/user-menu.tsx`
            and are not Clerk's; see that file for why.

            🚨 **The card is still a card, and `doc/paper.tsx` says it should
            not be**: "a card goes around things that are data… never around the
            page's own argument", then "nothing with an input in it goes on
            paper". A sign-in form is the letter asking you something. Every
            other form here obeys that; this one does not, because the markup is
            Clerk's.

            ⚠️ **Taking it off was attempted and reverted.** `elements.cardBox`
            and `elements.card` set to `shadow-none border-0 bg-transparent`
            changed nothing on screen — the classes did not win, and the likely
            reason is the cascade: Clerk v7 emits its own styles into a layer, so
            a utility class can lose to them regardless of specificity. Whoever
            picks this up should look at `cssLayerName` on this same
            `appearance` object before trying more element keys; adding keys that
            do not apply is what the last attempt did.

            ⚠️ **The shadow is a separate, older instance of the same problem.**
            `card: "shadow-none …"` is set right here and a drop shadow renders
            anyway — a config that reads as deliberate and does nothing. */}
        <ClerkProvider
          localization={clerkLocalization(locale)}
          appearance={{
            variables: {
              colorPrimary: "#ea5b48",
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

              // Clerk's "Secured by Clerk" footer. Nothing in this product's
              // chrome is another company's, least of all on the surface whose
              // entire argument is who can and cannot read your data.
              footer: "hidden!",
            },
          }}
        >
          <ConvexClientProvider>
            <LocaleProvider locale={locale}>{children}</LocaleProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
