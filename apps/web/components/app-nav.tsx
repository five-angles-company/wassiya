import Link from "next/link"
import { Separator } from "@workspace/ui/components/separator"

import { LanguageToggle } from "@/components/language-toggle"
import { MobileNav } from "@/components/mobile-nav"
import { NavLinks } from "@/components/nav-links"
import { NotificationBell } from "@/components/notification-bell"
import { UserMenu } from "@/components/user-menu"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * The bar.
 *
 * ## Why a bar and not a rail
 *
 * A rail is for an operator moving between fifteen tables all day. Nobody here
 * is that: an heir opens this app a handful of times over a month, and a
 * guardian perhaps twice in a decade. Giving a quarter of every screen to
 * navigation neither of them needs made the product read like the admin
 * console — which is a different tool for a different person, and the one thing
 * this surface should not feel like.
 *
 * ## Why it is near-white and the page is not
 *
 * The bar took the card tone first, and that was wrong: `#ebddc5` on `#f5ead8`
 * is a four-percent step, so the chrome read as another panel of content rather
 * than as the frame around it. `sand-50` is the palette's only near-white and
 * exists for this — enough separation that the bar is obviously chrome, warm
 * enough that it is not a foreign component. Pure white would pick up a cold
 * cast beside the sand ground.
 *
 * A hairline underneath and nothing else. No shadow: the contrast step is
 * already doing that work, and a drop shadow on a bar that never overlaps
 * anything is decoration.
 *
 * ## It is a Server Component with client leaves
 *
 * `LanguageToggle` is a form POST that must work with no JavaScript, and it
 * reads `x-pathname` off the request — it cannot live inside a Client
 * Component. The pieces that genuinely need the client are the ones that own
 * state: the links (active path), the menu (open/closed), the bell (a
 * subscription). A server parent can render client children; the reverse is
 * what does not work, which is why this file is the shell and not the whole
 * bar.
 */
export async function AppNav() {
  const locale = await getLocale()
  const nav = t(NAV, locale)

  return (
    <header className="bg-sand-50/90 border-border sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center gap-2 px-4 md:gap-3 md:px-6">
        <MobileNav />

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-full pe-2"
        >
          <span
            aria-hidden
            className="bg-primary text-primary-foreground font-heading grid size-8 shrink-0 place-items-center rounded-[10px] text-[17px] font-black"
          >
            و
          </span>
          <span className="font-heading text-[16px] font-extrabold">
            {nav.appName}
          </span>
        </Link>

        <NavLinks />

        {/* `ms-auto`, not `ml-auto`: under RTL this has to push toward the left
            edge, and only the logical property flips. */}
        <div className="ms-auto flex shrink-0 items-center gap-1.5">
          <NotificationBell />
          <LanguageToggle locale={locale} />
          <Separator
            orientation="vertical"
            className="mx-1 data-[orientation=vertical]:h-5"
          />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
