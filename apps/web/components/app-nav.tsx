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
 * ## Three columns, and the middle one is a true centre
 *
 * The first version ran brand → links → `ms-auto` → controls, which is not a
 * layout so much as the absence of one: everything piled against the start edge
 * and left a hole in the middle of every screen. With two or three short Arabic
 * words in the row, that hole was most of the bar.
 *
 * `grid-cols-[1fr_auto_1fr]` centres the links on the column, not on whatever
 * is left over after the brand and the controls have taken their width. That
 * distinction is the whole point: a flex row with `mx-auto` on the nav drifts
 * as the link set changes, and this link set changes per person — an heir, a
 * guardian, both, or neither each get a different number of links, and none of
 * them should shunt the row sideways.
 *
 * ## The row is boxed to the content column, not to the window
 *
 * Full-bleed was tried and the ends were wrong: the brand and the avatar ended
 * up hard against the window edges with nothing under them, which reads as
 * crowding rather than as an application frame. Boxed to the same 1180px as the
 * page means every edge in the product lines up — the mark sits directly over
 * the first word of the page heading, and the avatar over the end of the
 * content.
 *
 * `justify-self-start` / `-end` are logical, so the three columns mirror under
 * RTL without a second rule.
 *
 * ## Near-white, and 56px
 *
 * `#ebddc5` on `#f5ead8` is a four-percent step, so a card-toned bar read as
 * another panel of content rather than the frame around it. `sand-50` is the
 * palette's only near-white and exists for this; pure white would pick up a
 * cold cast beside the sand ground. A hairline underneath and no shadow — the
 * contrast step already does that work.
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
