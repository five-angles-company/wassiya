import type { ReactNode } from "react"

import { PageGround } from "@/components/page-ground"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { NAV } from "@/lib/i18n/strings/nav"
import { getTheme } from "@/lib/theme-server"

/**
 * The chrome around every page, 404 and error boundary included. It sits in
 * the root layout, outside `AuthGate`, so the header never vanishes while a
 * signed-in session is still loading.
 */
export async function SiteShell({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  const theme = await getTheme()
  const nav = t(NAV, locale)

  return (
    <div className="relative isolate flex min-h-svh flex-col">
      <PageGround />
      <a
        href="#content"
        className="bg-primary text-primary-foreground sr-only rounded-full px-4 py-2 text-sm font-semibold focus:not-sr-only focus:fixed focus:start-4 focus:top-20 focus:z-50"
      >
        {nav.skipToContent}
      </a>
      <SiteHeader locale={locale} theme={theme} />
      <main id="content" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter locale={locale} />
    </div>
  )
}
