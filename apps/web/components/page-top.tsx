import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { t, type Locale } from "@/lib/i18n/locale"
import type { Theme } from "@/lib/theme"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * The mark and the two controls that have nowhere else to live, set at the top
 * of the page like a letterhead.
 *
 * **It is not a bar, and it must not become one again.** It does not stick, it
 * takes no ground, no hairline and no fixed height, and it sits inside the
 * content column rather than spanning the window. It scrolls away with the
 * first screenful and does not come back.
 *
 * The bar it replaced held a row of destinations, then lost them: `/` routes a
 * reader into the one thing they have in flight rather than offering places to
 * go. What was left was a strip whose only job was to hold three controls, so it
 * read as empty at every width — and no amount of height, fill or type weight
 * fixes a container with nothing in it. A reveal-on-scroll title was tried to
 * give it something to say; that was the container arguing for its own
 * existence. The page's own heading is the header.
 *
 * What is lost is a persistent way home while scrolled, and that is affordable
 * here: a reader has one case, they are reading it, and a case carries an
 * explicit route to their others in its footer when it has any.
 *
 * It takes the one column measure the whole app uses, so the mark sits over the
 * first word of the heading on every screen and never moves as a reader crosses
 * between them.
 *
 * ## The mark is the brand's own, and the name beside it is not
 *
 * `brand/mark.png` is the ribbon "w", derived from `logo-mark.png` in the
 * mobile app's brand sources — the same file every shipped icon is cut from, so
 * the two apps cannot drift. It had been a hand-drawn terracotta square holding
 * an Arabic "و", which appears nowhere in the brand.
 *
 * The **wordmark is deliberately not used.** It sets "wassiya" in Latin, and
 * this is an Arabic-first RTL product: the name beside the mark is localised
 * text, so an Arabic reader gets وصيّة and an English one Wassiya.
 *
 * The **mark** is the only route to `/`. The **language switch** is a form POST
 * that must work with no JavaScript on every surface, including the signed-out
 * ones, so it cannot go inside the avatar menu — a signed-out reader has no
 * avatar. `trailing` is that avatar, and Clerk renders nothing without a
 * session, so the corner simply ends after the language switch.
 */
export function PageTop({
  locale,
  theme,
  trailing,
}: {
  locale: Locale
  theme: Theme
  trailing?: ReactNode
}) {
  const nav = t(NAV, locale)

  return (
    <div
      className="mx-auto flex w-full max-w-[920px] items-center gap-3 px-4 pt-5 md:px-6"
    >
      <Link
        href="/"
        // The whole lockup is the target: this is the only route home on a
        // surface with no nav, and a 24px square is not something to ask a
        // thumb to find.
        className="group -ms-1.5 flex min-h-11 shrink-0 items-center gap-2.5 rounded-full px-1.5 transition-colors"
      >
        <Image
          src="/brand/mark.png"
          alt=""
          aria-hidden
          width={52}
          height={26}
          priority
          className="h-[26px] w-auto shrink-0 transition-transform group-hover:scale-105"
        />
        <span className="font-heading text-[15px] font-bold">
          {nav.appName}
        </span>
      </Link>

      <div className="ms-auto flex items-center gap-1">
        <ThemeToggle theme={theme} locale={locale} />
        <LanguageToggle locale={locale} />
        {trailing}
      </div>
    </div>
  )
}
