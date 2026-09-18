import { TooltipProvider } from "@workspace/ui/components/tooltip"

import { PageTop } from "@/components/page-top"
import { UserMenu } from "@/components/user-menu"
import { getLocale } from "@/lib/i18n/server"
import { getTheme } from "@/lib/theme-server"

/**
 * The shell for a case, and the one part of this app that is **not** behind the
 * sign-in wall.
 *
 * `(app)/layout.tsx` does a server `redirect()` and wraps everything in
 * `AuthGate`, whose `<Authenticated>` renders nothing for an anonymous reader.
 * A case page is for exactly that reader — `claims.publicStatus` takes no
 * account, because the claim id is the capability and the funnel is written to
 * be forwarded to a relative — so it lives in its own group rather than trying
 * to punch a hole through that gate.
 *
 * `PageTop` is the same letterhead the doorway and the app draw, so the mark
 * does not move as someone crosses all three following an emailed link.
 *
 * **It carries the avatar too, and must.** This page had none, on the reasoning
 * that it is a public surface — but a signed-in claimant with a single case is
 * *redirected here by `/`*, and the mark only sends them back. With no avatar
 * there was no route from their own case to their account, their notifications,
 * or signing out. Clerk's `UserButton` renders nothing without a session, so a
 * signed-out reader still sees only the mark and the language switch.
 *
 * The column is a reading measure, and it is **the same one every screen in
 * this app uses**. Two measures meant the page jumped width whenever a reader
 * crossed between `(app)` and `(case)` — which they do constantly, since `/`
 * routes them straight in here.
 */
export default async function CaseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const theme = await getTheme()

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex min-h-svh flex-col" data-surface="heir">
        <PageTop locale={locale} theme={theme} trailing={<UserMenu />} />
        <main className="mx-auto w-full max-w-[920px] px-4 pt-8 pb-20 md:px-6">
          {children}
        </main>
      </div>
    </TooltipProvider>
  )
}
