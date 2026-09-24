import { cookies } from "next/headers"
import { Cairo, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"

import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import { ConvexClientProvider } from "@/components/convex-client-provider"
import { LocaleProvider } from "@/components/locale-provider"
import { SiteShell } from "@/components/site-shell"
import { clerkLocalization } from "@/lib/clerk-localization"
import { dirFor, LOCALE_COOKIE, resolveLocale } from "@/lib/i18n/locale"
import { getTheme } from "@/lib/theme-server"

const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

// Cairo for headings and IBM Plex Sans Arabic for body text, in both languages
// — Plex carries a full Latin set, so English needs no third face.
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
 * `dir`, `lang` and the theme are read from cookies on the server so they are
 * right in the first byte — a page that renders LTR and then flips is worse
 * than one that is simply English. The cost is that every route renders
 * dynamically; `apps/landing` is the static site.
 *
 * ⚠️ Dark comes only from the reader's own switch (the cookie), never from
 * `prefers-color-scheme`. See `lib/theme.ts`.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const theme = await getTheme()

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      suppressHydrationWarning
      className={cn(
        "wassiya font-sans antialiased",
        theme === "dark" && "dark",
        fontMono.variable,
        plexArabic.variable,
        cairo.variable
      )}
      style={{ "--font-sans": "var(--font-plex-arabic)" } as React.CSSProperties}
    >
      <body>
        {/* ClerkProvider must wrap ConvexClientProvider — Convex reads Clerk's
            context to get its access token.

            Clerk's colours are the palette's CSS variables, so the theme
            switch repaints it without a reload. `elevation: "flush"` drops
            Clerk's own card; `AuthShell` supplies ours. The footer is hidden
            with `!` because Clerk's styles sit in a layer that plain utility
            classes do not beat — nothing in this product's chrome is another
            company's. */}
        <ClerkProvider
          localization={clerkLocalization(locale)}
          appearance={{
            options: { elevation: "flush" },
            variables: {
              colorPrimary: "var(--primary)",
              colorPrimaryForeground: "var(--primary-foreground)",
              colorBackground: "var(--card)",
              colorForeground: "var(--foreground)",
              colorMutedForeground: "var(--muted-foreground)",
              colorMuted: "var(--muted)",
              colorInput: "var(--background)",
              colorInputForeground: "var(--foreground)",
              colorBorder: "var(--border)",
              colorRing: "var(--ring)",
              colorShadow: "transparent",
              borderRadius: "1rem",
              fontFamily: "var(--font-body-wassiya)",
            },
            elements: {
              cardBox: "shadow-none! border-0! bg-transparent! w-full!",
              card: "shadow-none! border-0! bg-transparent! p-0!",
              formButtonPrimary: "rounded-full! h-12! text-[15px]! font-semibold!",
              socialButtonsBlockButton: "rounded-full! h-12!",
              formFieldInput: "rounded-[18px]! h-12!",
              footer: "hidden!",
            },
          }}
        >
          <ConvexClientProvider>
            <LocaleProvider locale={locale}>
              <SiteShell>{children}</SiteShell>
            </LocaleProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
