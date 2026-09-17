import Link from "next/link"

import { LanguageToggle } from "@/components/language-toggle"
import { MobileNav } from "@/components/mobile-nav"
import { NavLinks } from "@/components/nav-links"
import { NotificationBell } from "@/components/notification-bell"
import { UserMenu } from "@/components/user-menu"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * The bar. A bar rather than a rail: an heir opens this app a handful of times
 * over a month and a guardian perhaps twice in a decade, so a quarter of every
 * screen given to navigation made the product read like the admin console.
 *
 * `grid-cols-[1fr_auto_1fr]` centres the links on the column rather than on
 * what is left after the brand and controls take their width. The link set
 * changes per person — heir, guardian, both, neither — and a flex row with
 * `mx-auto` drifts as it does. `justify-self-start`/`-end` are logical, so the
 * columns mirror under RTL without a second rule.
 *
 * Boxed to the same 1180px as the page, so the mark sits over the first word of
 * the page heading. `sand-50` is the palette's only near-white and exists for
 * this: `#ebddc5` on `#f5ead8` is a four-percent step, so a card-toned bar read
 * as another panel of content rather than the frame around it.
 *
 * A Server Component with client leaves. `LanguageToggle` is a form POST that
 * must work with no JavaScript and reads `x-pathname` off the request, so it
 * cannot live inside a Client Component; only the pieces that own state (links,
 * menu, bell, avatar) are client.
 */
export async function AppNav() {
  const locale = await getLocale()
  const nav = t(NAV, locale)

  return (
    <header className="bg-sand-50/90 border-border sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto grid h-14 w-full max-w-[1180px] grid-cols-[1fr_auto_1fr] items-center px-4 md:px-6">
        <div className="flex items-center gap-2 justify-self-start">
          <MobileNav />
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span
              aria-hidden
              className="bg-primary text-primary-foreground font-heading grid size-7 shrink-0 place-items-center rounded-[9px] text-[15px] font-black"
            >
              و
            </span>
            <span className="font-heading text-[15.5px] font-extrabold">
              {nav.appName}
            </span>
          </Link>
        </div>

        <NavLinks />

        <div className="flex shrink-0 items-center gap-0.5 justify-self-end">
          <NotificationBell />
          <LanguageToggle locale={locale} />
          <div className="ms-1.5 flex items-center">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
