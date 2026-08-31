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
 * The bar.
 *
 * ## Why a bar and not a rail
 *
 * A rail is for an operator moving between fifteen tables all day. Nobody here
 * is that: an heir opens this app a handful of times over a month, and a
 * guardian perhaps twice in a decade. Giving a quarter of every screen to
 * navigation neither of them needs made the product read like the admin
 * console — a different tool, for a different person, and the one thing this
 * surface should not feel like.
 *
 * ## Near-white, and 56px
 *
 * The bar took the card tone first, and that was wrong: `#ebddc5` on `#f5ead8`
 * is a four-percent step, so the chrome read as another panel of content rather
 * than the frame around it. `sand-50` is the palette's only near-white and
 * exists for this. Pure white would pick up a cold cast beside the sand ground.
 *
 * 56px rather than 64: this bar carries three short words and a controls
 * cluster, and the extra height was empty. A hairline underneath and nothing
 * else — no shadow, because the contrast step already does that work and a drop
 * shadow on a bar that never overlaps anything is decoration.
 *
 * ## One cluster, one footprint
 *
 * Bell, language and avatar are all 36px tall ghost controls with the same
 * hover. They were three different weights with a divider between two of them,
 * which is what made the row look assembled rather than designed; matching
 * footprints are most of the fix, and the divider was the rest.
 *
 * ## It is a Server Component with client leaves
 *
 * `LanguageToggle` is a form POST that must work with no JavaScript, and it
 * reads `x-pathname` off the request — it cannot live inside a Client
 * Component. The pieces that genuinely need the client are the ones that own
 * state: the links (active path), the menu (open/closed), the bell (a
 * subscription), the avatar (a locale-labelled Clerk menu item).
 */
export async function AppNav() {
  const locale = await getLocale()
  const nav = t(NAV, locale)

  return (
    <header className="bg-sand-50/90 border-border sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1180px] items-center px-4 md:px-6">
        <MobileNav />

        <Link
          href="/"
          className="me-2 flex shrink-0 items-center gap-2.5 md:me-5"
        >
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

        <NavLinks />

        {/* `ms-auto`, not `ml-auto`: under RTL this has to push toward the left
            edge, and only the logical property flips. */}
        <div className="ms-auto flex shrink-0 items-center gap-0.5">
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
