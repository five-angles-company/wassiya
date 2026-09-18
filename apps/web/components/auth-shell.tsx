import type { ReactNode } from "react"

import { PageTop } from "@/components/page-top"
import { getLocale } from "@/lib/i18n/server"
import { getTheme } from "@/lib/theme-server"

/**
 * The frame around sign-in and sign-up.
 *
 * These two routes sit outside `(app)`, whose layout redirects anyone without
 * a session — which is every reader of these two screens.
 *
 * They still get a mark and the language switch. Without them these were the
 * only screens in the product with no way back and no way to change language,
 * which made signing in feel like leaving the site — and the reader arriving
 * here is often following an emailed link in the wrong language.
 *
 * It is `PageTop`, the same component the app and the case page draw, so the
 * mark cannot drift between the doorway and what is behind it. No avatar is the
 * only difference the reader should be able to see.
 *
 * ## ⚠️ It stays centred while Clerk still draws a card
 *
 * Moving it to the app's own column — `max-w-[920px] px-4 pt-8`, what every
 * other screen uses — was tried and reverted the same hour. The argument for it
 * was sound: `PageTop`'s docstring says the mark should sit over the first word
 * of the heading *"and never move as a reader crosses between them"*, and a
 * document starts at the top rather than floating in the middle.
 *
 * 🚨 **But it only holds once the card is gone.** A fixed-width card start-aligned
 * in a 920px column is a box shoved against one edge with acres of empty page
 * under it — worse than the centred version it replaced, and the two changes had
 * to land together or not at all. The card is Clerk's and it did not come off
 * when asked; until it does, centring is what makes a fixed-width box look
 * deliberate.
 */
export async function AuthShell({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  const theme = await getTheme()

  return (
    <div className="flex min-h-svh flex-col">
      <PageTop locale={locale} theme={theme} />

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        {children}
      </main>
    </div>
  )
}
