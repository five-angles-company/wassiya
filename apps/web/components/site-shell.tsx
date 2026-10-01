import { headers } from "next/headers"
import type { ReactNode } from "react"

import { SiteFooter } from "@workspace/ui/components/site/site-footer"
import { SiteHeader } from "@workspace/ui/components/site/site-header"
import { siteCopy } from "@workspace/ui/lib/site"

import { AccountSlot } from "@/components/account-slot"
import { PageGround } from "@/components/page-ground"
import { WebNav } from "@/components/web-nav"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { NAV } from "@/lib/i18n/strings/nav"
import { siteHrefs } from "@/lib/site-hrefs"

/**
 * The chrome around every page, 404 and error boundary included: the header
 * frame and footer wassiya.app uses, with this app's own menu and account
 * control, so moving between the two never changes the chrome.
 * It sits in the root layout, outside `AuthGate`, so the header never vanishes
 * while a signed-in session is still loading.
 */
export async function SiteShell({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  const nav = t(NAV, locale)
  // Set by `proxy.ts`; without it the language link lands on the home page.
  const here = (await headers()).get("x-pathname") ?? "/"
  const hrefs = siteHrefs(locale, here)

  return (
    <div className="relative isolate flex min-h-svh flex-col">
      <PageGround />
      <a
        href="#content"
        className="bg-primary text-primary-foreground sr-only rounded-full px-4 py-2 text-sm font-semibold focus:not-sr-only focus:fixed focus:start-4 focus:top-20 focus:z-50"
      >
        {nav.skipToContent}
      </a>
      <SiteHeader
        locale={locale}
        hrefs={hrefs}
        markSrc="/brand/mark.png"
        nav={<WebNav />}
        actions={<AccountSlot signInLabel={siteCopy(locale).signIn} />}
      />
      <main id="content" className="flex flex-1 flex-col">
        {children}
      </main>
      <div className="mt-16">
        <SiteFooter locale={locale} hrefs={hrefs} markSrc="/brand/mark.png" />
      </div>
    </div>
  )
}
