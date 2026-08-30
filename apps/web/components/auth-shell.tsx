import type { ReactNode } from "react"
import { Separator } from "@workspace/ui/components/separator"

import { LanguageToggle } from "@/components/language-toggle"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * The frame around sign-in and sign-up.
 *
 * These two routes sit outside `(app)` — they are the only screens reachable
 * without a session, so they cannot render the rail, which subscribes to Convex
 * queries that require one.
 *
 * They still get a mark and the language switch. Without them these were the
 * only screens in the product with no way back and no way to change language,
 * which made signing in feel like leaving the site — and the reader arriving
 * here is often following an emailed link in the wrong language.
 *
 * A Server Component with a client leaf, so this page ships no JavaScript of
 * its own beyond Clerk's card.
 */
export async function AuthShell({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  const nav = t(NAV, locale)

  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-sand-50 border-border flex h-16 shrink-0 items-center gap-3 border-b px-4 md:px-6">
        <span
          aria-hidden
          className="bg-primary text-primary-foreground font-heading grid size-8 shrink-0 place-items-center rounded-[10px] text-[17px] font-black"
        >
          و
        </span>
        <span className="font-heading text-[16px] font-extrabold">
          {nav.appName}
        </span>
        <div className="ms-auto flex items-center gap-2">
          <Separator
            orientation="vertical"
            className="me-1 data-[orientation=vertical]:h-4"
          />
          <LanguageToggle locale={locale} />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        {children}
      </main>
    </div>
  )
}
