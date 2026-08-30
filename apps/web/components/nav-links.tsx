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
 * ## Active is a carved pill, not a painted one
 *
 * The bar sits on the card tone and the page on the ground; the active item
 * takes the *ground* colour, so it reads as a notch cut through the bar to the
 * screen below rather than as a fifth coloured object. Terracotta stays
 * reserved for the one action a screen is asking for — a nav bar that wears the
 * accent on every visit spends it.
 */
export function NavLinks() {
  const locale = useLocale()
  const nav = t(NAV, locale)
  const pathname = usePathname()
  const groups = useNavGroups().filter((group) =>
    group.items.some((item) => item.secondary !== true)
  )

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {groups.map((group, index) => (
        <div key={group.key} className="flex items-center gap-1">
          {index > 0 && (
            <span
              aria-hidden
              className="bg-border mx-2 h-5 w-px shrink-0 self-center"
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
                  className={`inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[14px] font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? "bg-background text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-sand-200"
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
