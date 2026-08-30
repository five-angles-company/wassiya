"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useLocale } from "@/components/locale-provider"
import { isNavActive } from "@/config/nav"
import { useNavGroups } from "@/hooks/use-nav-groups"
import { t } from "@/lib/i18n/locale"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * The bar's links, on one row.
 *
 * A Client Component because the active item comes from `usePathname()`. In
 * Next 16 layouts are cached across navigation and do not re-render, so an
 * active state computed in the layout would highlight whichever route happened
 * to be first.
 *
 * ## The groups flatten here, and the seam still shows
 *
 * A bar has no room for section labels, so the three groups run together as one
 * row — but a hairline divider marks where the heir's links end and the
 * guardian's begin, for the person who is both. Without it, "صندوقي" and "ما هو
 * مطلوب" sit adjacent and read as one list of five unrelated things.
 *
 * ## Why the active item is not a filled pill
 *
 * It was, twice, and both fills are unusable on a near-white bar. Measured
 * against `sand-50`: the sand ground is a 4% step, and `accent` — the palette's
 * soft terracotta tint — comes out at **1.19:1**, well under the 3:1 a shape
 * needs to read as a shape. A pill nobody can see is worse than no pill,
 * because the row then has an invisible fourth state in it.
 *
 * So the state is carried by ink and a rule: `terracotta-800` at 6.5:1 against
 * the bar, over a 2.5px underline at 3.5:1. That is the top-bar idiom for a
 * reason — on a light chrome it is the only treatment with contrast to spare,
 * and it leaves the solid accent unspent for the one action a screen is asking
 * for.
 *
 * Inactive is `sand-700` (6.3:1), not `--muted-foreground` (4.1:1, under AA at
 * this size). Nav labels are the last place to spend a shortfall.
 */
export function NavLinks() {
  const locale = useLocale()
  const nav = t(NAV, locale)
  const pathname = usePathname()
  const groups = useNavGroups().filter((group) =>
    group.items.some((item) => item.secondary !== true)
  )

  return (
    <nav className="hidden h-16 items-stretch md:flex">
      {groups.map((group, index) => (
        <div key={group.key} className="flex items-stretch">
          {index > 0 && (
            <span
              aria-hidden
              className="bg-border mx-3 my-auto h-5 w-px shrink-0"
            />
          )}
          {group.items
            .filter((item) => item.secondary !== true)
            .map((item) => {
              const active = isNavActive(pathname, item.href)
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  // The underline is an `::after` pinned to the bar's own
                  // bottom edge, which is why each link is full bar height
                  // rather than a floating pill.
                  className={`relative inline-flex items-center gap-2 px-3.5 text-[14px] font-semibold whitespace-nowrap transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-[2.5px] after:rounded-t-full ${
                    active
                      ? "text-terracotta-800 after:bg-primary"
                      : "text-sand-700 hover:text-foreground after:bg-transparent"
                  }`}
                >
                  <item.icon
                    className="size-4 shrink-0"
                    strokeWidth={2.3}
                    aria-hidden
                  />
                  {nav[item.key]}
                </Link>
              )
            })}
        </div>
      ))}
    </nav>
  )
}
