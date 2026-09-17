import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import { AppNav } from "@/components/app-nav"
import { AuthGate } from "@/components/auth-gate"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { safePath } from "@/lib/safe-path"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * The app shell: everything behind the sign-in wall. A route group, so
 * `/sign-in` and `/sign-up` sit outside it and keep rendering as bare centred
 * cards.
 *
 * Two gates answering different questions. `await auth()` answers "is anyone
 * signed in?" — a Clerk fact available on the server, and the cheapest way to
 * bounce an anonymous visitor before any markup is generated. It cannot answer
 * "has Convex caught up?", which is what `AuthGate` waits for client-side.
 * Behind both, every Convex function derives the caller itself; that is the only
 * load-bearing one.
 *
 * **The bounce carries the destination.** The two links that matter most arrive
 * by email — a guardian's `/guardian/accept?token=…` and an heir's box — and
 * both are opened by someone not signed in, so a bare `/sign-in` would drop the
 * token. A Server Component cannot read its own URL, so the path comes from
 * `x-pathname`, which `proxy.ts` sets for this and for the language switch.
 *
 * The document scrolls and the bar sticks. Pinning the shell to one viewport and
 * handing an inner region the scroll is what a rail needs, not a bar — and a
 * height-constrained flex column makes every card a shrinkable child, which is
 * exactly how this product broke once already.
 *
 * `TooltipProvider` stays: this package's `Tooltip` is a bare Radix root with no
 * provider of its own.
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
        <a
          href="#content"
          className="bg-primary text-primary-foreground sr-only rounded-full px-4 py-2 text-sm font-semibold focus:not-sr-only focus:absolute focus:start-3 focus:top-3 focus:z-50"
        >
          {nav.skipToContent}
        </a>

        <AppNav />

        <main
          id="content"
          className="mx-auto w-full max-w-[1180px] space-y-6 px-4 py-6 md:px-6 md:py-8"
        >
          {children}
        </main>

        <Toaster position="bottom-center" richColors />
      </TooltipProvider>
    </AuthGate>
  )
}
