import { Page } from "@/components/shell/page"
import { SiteFooter } from "@/components/shell/site-footer"
import { SiteHeader } from "@/components/shell/site-header"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * Bar, content, footer — the frame every screen sits in.
 *
 * Composed by each page rather than installed in a layout, because the two
 * mid-flow step screens want the *focused* bar and no footer, and they live in
 * the same route group as three screens that want the full one. Route-group
 * gymnastics to express that would be harder to follow than one wrapper each
 * page opts into.
 *
 * The skip link is the first thing in the tab order. It is not decoration: the
 * bar puts four links and two controls ahead of the content, and someone on a
 * keyboard or a screen reader should not have to walk them on every page.
 */
export async function SiteShell({
  width,
  className,
  children,
}: {
  width?: "prose" | "narrow" | "default"
  className?: string
  children: React.ReactNode
}) {
  const labels = t(NAV, await getLocale())

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#content"
        className="bg-primary text-primary-foreground sr-only rounded-full px-4 py-2 text-[14px] font-semibold focus:not-sr-only focus:absolute focus:top-3 focus:start-3 focus:z-50"
      >
        {labels.skipToContent}
      </a>

      <SiteHeader />
      <Page width={width} className={className}>
        {children}
      </Page>
      <div className="mt-auto">
        <SiteFooter />
      </div>
    </div>
  )
}
