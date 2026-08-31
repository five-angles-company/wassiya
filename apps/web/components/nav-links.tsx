"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useLocale } from "@/components/locale-provider"
import { isNavActive } from "@/config/nav"
import { useNavGroups } from "@/hooks/use-nav-groups"
import { t } from "@/lib/i18n/locale"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * The bar's links, centred, on one row.
 *
 * A Client Component because the active item comes from `usePathname()`. In
 * Next 16 layouts are cached across navigation and do not re-render, so an
 * active state computed in the layout would highlight whichever route happened
 * to be first.
 *
 * ## One flat row — the groups only decide who sees what
 *
 * There was a hairline between the heir's links and the guardian's, on the
 * argument that a person who is both should see the seam. In a five-word row it
 * was one more object in a bar that already had too many, and the labels do
 * that work on their own: nobody reads "صندوقي" and "ما هو مطلوب" as the same
 * kind of thing. `NAV_GROUPS` still decides *which* links exist per person —
 * see `use-nav-groups` — but the grouping stops at the data now. The phone
 * menu, which is a scanned list rather than a read row, keeps its section
 * headings.
 *
 * ## No icons here, and icons in the phone menu
 *
 * They were in both and the bar was the worse for it. Five words each wearing a
 * glyph is ten objects across the top of every screen, and none of the icons
 * earned its place — "الرئيسية" is not clarified by a house.
 *
 * ## Active is darker, not more colourful
 *
 * A filled pill was tried twice and both fills are unusable on a near-white
 * bar: measured against `sand-50`, the ground tone is a 4% step and `accent`
 * comes out at **1.19:1**, well under the 3:1 a shape needs to read as a shape.
 *
 * What replaced it went the other way and coloured the label terracotta, which
 * put a second warm hue in a bar that already has one in the mark. So the
 * hierarchy is weight and darkness — `foreground` at 16:1 against `sand-700` at
 * 6.3:1 — and the hue lives in the 2px rule underneath, where one accent is
 * plenty and the solid primary stays unspent for a screen's real action.
 */
export function NavLinks() {
  const locale = useLocale()
  const nav = t(NAV, locale)
  const pathname = usePathname()
  const items = useNavGroups()
    .flatMap((group) => group.items)
    .filter((item) => item.secondary !== true)

  return (
    // `justify-self-center` is the grid parent's middle column doing the
    // centring; this element only has to not stretch inside it.
    <nav className="hidden h-14 items-stretch justify-self-center md:flex">
      {items.map((item) => {
        const active = isNavActive(pathname, item.href)
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            // The rule is an `::after` pinned to the bar's own bottom edge,
            // which is why each link is full bar height rather than a floating
            // pill.
            className={`relative inline-flex items-center px-4 text-[14.5px] whitespace-nowrap transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:rounded-t-full ${
              active
                ? "text-foreground font-bold after:bg-primary"
                : "text-sand-700 hover:text-foreground font-semibold after:bg-transparent"
            }`}
          >
            {nav[item.key]}
          </Link>
        )
      })}
    </nav>
  )
}
