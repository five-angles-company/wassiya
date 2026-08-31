import type { ReactNode } from "react"

import { LanguageToggle } from "@/components/language-toggle"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * The frame around sign-in and sign-up.
 *
 * These two routes sit outside `(app)` — they are the only screens reachable
 * without a session, so they cannot render `AppNav`, whose links subscribe to
 * Convex queries that require one.
 *
 * They still get a mark and the language switch. Without them these were the
 * only screens in the product with no way back and no way to change language,
 * which made signing in feel like leaving the site — and the reader arriving
 * here is often following an emailed link in the wrong language.
 *
 * The bar matches `AppNav` exactly: same height, same near-white, same hairline,
 * and the same 1180px column, so the mark does not jump between the doorway and
 * the app. It has no nav row and no avatar, which is the only difference the
 * reader should be able to see.
 *
 * A Server Component with a client leaf, so this page ships no JavaScript of
 * its own beyond Clerk's card.
 */
export async function AuthShell({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  const nav = t(NAV, locale)

  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-sand-50 border-border flex h-14 shrink-0 justify-center border-b">
        <div className="flex w-full max-w-[1180px] items-center gap-2.5 px-4 md:px-6">
          <span
            aria-hidden
            className="bg-primary text-primary-foreground font-heading grid size-7 shrink-0 place-items-center rounded-[9px] text-[15px] font-black"
          >
            و
          </span>
          <span className="font-heading text-[15.5px] font-extrabold">
            {nav.appName}
          </span>
          <div className="ms-auto flex items-center">
            <LanguageToggle locale={locale} />
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        {children}
      </main>
    </div>
  )
}
