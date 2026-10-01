import type { Metadata, Viewport } from "next"
import { cookies } from "next/headers"
import { Cairo, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"

import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import { ConvexClientProvider } from "@/components/convex-client-provider"
import { LocaleProvider } from "@/components/locale-provider"
import { SiteShell } from "@/components/site-shell"
import { clerkLocalization } from "@/lib/clerk-localization"
import { dirFor, LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * ⚠️ **Nothing here is indexed.** Case and delivery URLs are capabilities, and
 * the public pages are reached from the landing site, which is the one meant to
 * be found. Tab titles never carry a name: they land in history and synced
 * tabs on shared family computers.
 */
export async function generateMetadata(): Promise<Metadata> {
  const nav = t(NAV, await getLocale())
  return {
    title: { template: `%s · ${nav.appName}`, default: nav.appName },
    description: nav.description,
    applicationName: nav.appName,
    robots: { index: false, follow: false },
    formatDetection: { telephone: false, email: false, address: false },
  }
}

export const viewport: Viewport = { themeColor: "#f5ead8" }

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
 * `dir` and `lang` are read from the cookie on the server so they are right in
 * the first byte — a page that renders LTR and then flips is worse than one
 * that is simply English. The cost is that every route renders dynamically;
 * `apps/landing` is the static site.
 *
 * ⚠️ Light only, like wassiya.app: never add `.dark` here or follow
 * `prefers-color-scheme`. A visitor must not feel they changed sites.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      suppressHydrationWarning
      className={cn(
        "wassiya font-sans antialiased",
        fontMono.variable,
        plexArabic.variable,
        cairo.variable
      )}
      style={{ "--font-sans": "var(--font-plex-arabic)" } as React.CSSProperties}
    >
      <body>
        {/* ClerkProvider must wrap ConvexClientProvider — Convex reads Clerk's
            context to get its access token. `dynamic` is what puts the CSP
            nonce on Clerk's script tags (`lib/csp.ts`).

            Clerk's colours are the palette's CSS variables. `elevation: "flush"` drops
            Clerk's own card; `AuthShell` supplies ours. The footer is hidden
            with `!` because Clerk's styles sit in a layer that plain utility
            classes do not beat — nothing in this product's chrome is another
            company's. */}
        <ClerkProvider
          dynamic
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
              rootBox: "w-full!",
              cardBox: "shadow-none! border-0! bg-transparent! w-full! max-w-none!",
              card: "shadow-none! border-0! bg-transparent! p-0! w-full! gap-7!",
              header: "items-start! text-start! gap-1.5!",
              headerTitle: "font-heading! text-[22px]! font-extrabold! leading-snug!",
              headerSubtitle: "text-[14.5px]! leading-relaxed!",
              formButtonPrimary: "rounded-full! h-12! text-[15px]! font-semibold!",
              buttonArrowIcon: "hidden!",
              socialButtonsBlockButton: "rounded-full! h-12!",
              socialButtonsBlockButtonText: "text-[14.5px]! font-semibold!",
              lastAuthenticationStrategyBadge: "hidden!",
              dividerLine: "bg-border!",
              dividerText: "text-[13px]!",
              formFieldLabel: "text-[14px]! font-semibold!",
              formFieldInput: "rounded-[18px]! h-12! text-[15px]!",
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
