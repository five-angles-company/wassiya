import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { MenuIcon } from "lucide-react"

import { LanguageToggle } from "@/components/language-toggle"
import { BrandMark } from "@/components/shell/brand-mark"
import { t, type Locale } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * The app bar.
 *
 * ## Why this is a Server Component, auth and all
 *
 * The obvious way to show "Sign in" or "My account" is `<Authenticated>` from
 * `convex/react` — which is the repo rule for anything that *reads data*,
 * because Clerk can consider a client signed in a beat before Convex has minted
 * its token. This is not that: it is one word of chrome, and getting it wrong
 * for 200ms costs nothing. `await auth()` answers on the server instead, which
 * keeps the header out of the client bundle entirely — and that is the whole
 * point, because the claim landing page underneath it is required to work with
 * JavaScript disabled.
 *
 * ## Two variants
 *
 * `full` everywhere, and `focused` on the two mid-flow step screens. The
 * board's rule for this funnel — *"no tabs, no vault chrome, nothing to install,
 * nothing to remember"* — was protecting a bereaved reader from being marketed
 * at, not from finding the legal page. But halfway through filing a death
 * report, a row of exits is exactly what it warned about, so those two screens
 * get the mark, the step and the language and nothing else.
 */
export async function SiteHeader({
  variant = "full",
  slot,
}: {
  variant?: "full" | "focused"
  /** `focused` only: the step indicator, rendered by the caller. */
  slot?: React.ReactNode
}) {
  const locale = await getLocale()
  const labels = t(NAV, locale)
  const { isAuthenticated } = await auth()

  return (
    <header className="bg-card border-border shadow-raised sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-5 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-full"
          aria-label={labels.home}
        >
          <BrandMark />
          <span className="text-[17px] font-bold">وصيّة</span>
        </Link>

        {variant === "full" ? (
          <>
            <nav className="ms-6 hidden items-center gap-1 md:flex">
              {navLinks(locale).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sand-700 hover:bg-sand-200 hover:text-foreground rounded-full px-3 py-1.5 text-[14px] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="ms-auto flex items-center gap-1">
              <LanguageToggle locale={locale} />
              <Link
                href={isAuthenticated ? "/claim" : "/sign-in"}
                className="bg-primary text-primary-foreground hover:bg-terracotta-600 hidden rounded-full px-4 py-2 text-[14px] font-semibold transition-colors sm:inline-flex"
              >
                {isAuthenticated ? labels.myAccount : labels.signIn}
              </Link>
              <MobileNav locale={locale} />
            </div>
          </>
        ) : (
          <div className="ms-auto flex items-center gap-4">
            {slot}
            <LanguageToggle locale={locale} />
          </div>
        )}
      </div>
    </header>
  )
}

function navLinks(locale: Locale) {
  const labels = t(NAV, locale)
  return [
    { href: "/claim", label: labels.fileClaim },
    { href: "/claim/guardian", label: labels.guardian },
    { href: "/legal/encryption", label: labels.security },
    { href: "/claim/contact", label: labels.help },
  ]
}

/**
 * The small-screen menu, as a `<details>` disclosure.
 *
 * Not a drawer with state. The landing page ships no JavaScript by design, and
 * a menu that needed hydration to open would be the one thing on the page that
 * stops working on the old browser the board keeps naming. `<details>` opens
 * natively, is keyboard-operable for free, and closes on Escape.
 */
function MobileNav({ locale }: { locale: Locale }) {
  const labels = t(NAV, locale)

  return (
    <details className="relative md:hidden [&[open]>summary>svg]:opacity-60">
      <summary
        className="hover:bg-sand-200 flex size-9 cursor-pointer list-none items-center justify-center rounded-full transition-colors [&::-webkit-details-marker]:hidden"
        aria-label={labels.openMenu}
      >
        <MenuIcon className="size-5" aria-hidden />
      </summary>
      <nav className="bg-card border-border shadow-overlay rounded-card absolute end-0 mt-2 flex w-56 flex-col border p-2">
        {navLinks(locale).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:bg-sand-200 rounded-full px-3.5 py-2.5 text-[14.5px] transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </details>
  )
}
