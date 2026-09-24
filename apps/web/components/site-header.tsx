import Image from "next/image"
import Link from "next/link"

import { AccountSlot } from "@/components/account-slot"
import { LanguageToggle } from "@/components/language-toggle"
import { SiteNav } from "@/components/site-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { t, type Locale } from "@/lib/i18n/locale"
import { NAV } from "@/lib/i18n/strings/nav"
import type { Theme } from "@/lib/theme"

/**
 * The sticky header, the same shape as the landing site's.
 *
 * The theme and language controls stay real `<form>` POSTs (see their
 * components): every surface here, signed out included, must switch without
 * JavaScript. The wordmark is not used — it is Latin; the name beside the mark
 * is localised text.
 */
export function SiteHeader({ locale, theme }: { locale: Locale; theme: Theme }) {
  const nav = t(NAV, locale)
  const items = [
    { href: "/", label: nav.home },
    { href: "/file", label: nav.reportDeath },
    { href: "/help", label: nav.help },
  ]

  return (
    <header className="site-header sticky top-0 z-40 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-2 px-4 md:h-[72px] md:px-8">
        <Link href="/" className="group -ms-1.5 flex min-h-11 shrink-0 items-center gap-2.5 rounded-full px-1.5">
          <Image
            src="/brand/mark.png"
            alt=""
            aria-hidden
            width={56}
            height={28}
            priority
            className="h-7 w-auto transition-transform duration-300 group-hover:scale-110"
          />
          <span className="font-heading text-[19px] font-black">{nav.appName}</span>
        </Link>

        <SiteNav items={items} label={nav.mainNav} />

        <div className="ms-auto flex items-center gap-1">
          <ThemeToggle theme={theme} locale={locale} />
          <LanguageToggle locale={locale} />
          <AccountSlot signInLabel={nav.signIn} />
        </div>
      </div>
    </header>
  )
}
