import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { AuthGate } from "@/components/auth-gate"
import { safePath } from "@/lib/safe-path"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * The app shell: everything behind the sign-in wall.
 *
 * A route group so `/sign-in` and `/sign-up` keep rendering as bare centred
 * cards — they sit outside this folder and inherit only the root layout.
 *
 * ## Two gates, answering different questions
 *
 * `await auth()` answers *"is anyone signed in?"* — a Clerk fact, available on
 * the server, and the cheapest way to bounce an anonymous visitor before any
 * markup is generated. It cannot answer *"has Convex caught up?"*, which is
 * what `AuthGate` waits for client-side. Behind both, every Convex function
 * this app calls derives the caller itself; that is the only load-bearing one.
 *
 * ## The bounce carries the destination
 *
 * The two links that matter most on this product arrive by email — a guardian's
 * `/guardian/accept?token=…` and an heir's box — and both are opened by someone
 * who is not signed in. Redirecting to a bare `/sign-in` would drop the token
 * and land them on a home page that cannot explain what they clicked. A Server
 * Component cannot read its own URL, so the path comes from `x-pathname`, which
 * `proxy.ts` sets for exactly this and for the language switch.
 *
 * ## The shell is one viewport tall and the region below owns the scroll
 *
 * `SidebarProvider` ships `min-h-svh`, which lets a long page grow the document
 * and take the sidebar with it. Pinning the height here means the rail and the
 * bar never move. `min-h-0` on each link of the chain is what makes that work:
 * a flex child defaults to `min-height: auto` and refuses to shrink below its
 * content, so without it every `flex-1` below is a lie.
 *
 * The content region is a **block**, not a flex column. A flex child defaults
 * to `flex-shrink: 1`, so cards would compress to fit the viewport instead of
 * overflowing it, and the region would never scroll.
 *
 * `TooltipProvider` is required rather than optional: `SidebarMenuButton`
 * renders a `Tooltip` whenever the rail is collapsed, and this package's
 * `Tooltip` is a bare Radix root with no provider of its own.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) {
    const here = safePath((await headers()).get("x-pathname"))
    redirect(`/sign-in?redirect_url=${encodeURIComponent(here)}`)
  }

  const nav = t(NAV, await getLocale())

  return (
    <AuthGate>
      <TooltipProvider delayDuration={0}>
        <SidebarProvider className="h-svh overflow-hidden">
          <a
            href="#content"
            className="bg-primary text-primary-foreground sr-only rounded-full px-4 py-2 text-sm font-semibold focus:not-sr-only focus:absolute focus:start-3 focus:top-3 focus:z-50"
          >
            {nav.skipToContent}
          </a>
          <AppSidebar />
          <SidebarInset className="min-h-0">
            <AppHeader />
            <div
              id="content"
              className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 md:p-6"
            >
              {children}
            </div>
            <Toaster position="bottom-center" richColors />
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </AuthGate>
  )
}
