"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { MenuIcon, XIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { isNavActive } from "@/config/nav"
import { useNavGroups } from "@/hooks/use-nav-groups"
import { t } from "@/lib/i18n/locale"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * The whole nav, for a narrow screen.
 *
 * Unlike the bar, this names **every** item including the secondary ones. The
 * bar can move those into an avatar and a bell because there is room beside them
 * to notice; a phone has neither the room nor the hover that makes an icon
 * self-explanatory. The section labels come back too — they are what tell a
 * person who is both an heir and a guardian that these are two different jobs.
 *
 * The active row is ink plus a rule at the start edge, for the reason
 * `nav-links` measures out: against the near-white sheet no tint in this palette
 * reaches 3:1, so a filled row would be invisible.
 *
 * Two details that only bite in Arabic. `side` comes from the locale rather than
 * the stylesheet, because the RTL transform rewrites left/right classNames but
 * `side` drives `data-[side=left]:left-0`, which no class rewrite reaches — and
 * a menu must open from the edge its trigger sits on. And the close button is
 * ours, because `SheetContent`'s ships a hardcoded English `sr-only` "Close".
 *
 * Closing on navigation is explicit: the sheet is a Radix root with its own open
 * state, and a `<Link>` inside it changes the route without Radix ever hearing.
 */
export function MobileNav() {
  const locale = useLocale()
  const nav = t(NAV, locale)
  const pathname = usePathname()
  const groups = useNavGroups()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="hover:bg-sand-100 text-sand-700 hover:text-foreground -ms-1.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors md:hidden"
        aria-label={nav.openMenu}
      >
        <MenuIcon className="size-5" strokeWidth={2.3} aria-hidden />
      </SheetTrigger>

      <SheetContent
        side={locale === "ar" ? "right" : "left"}
        showCloseButton={false}
        className="bg-sand-50 gap-0 p-0"
      >
        <SheetHeader className="border-border flex-row items-center justify-between gap-3 border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2.5 text-start">
            <span
              aria-hidden
              className="bg-primary text-primary-foreground font-heading grid size-8 shrink-0 place-items-center rounded-[10px] text-[17px] font-black"
            >
              و
            </span>
            <span className="font-heading text-[15.5px] font-extrabold">
              {nav.appName}
            </span>
          </SheetTitle>
          <SheetClose
            aria-label={nav.closeMenu}
            className="hover:bg-sand-100 text-sand-700 hover:text-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
          >
            <XIcon className="size-5" strokeWidth={2.3} aria-hidden />
          </SheetClose>
        </SheetHeader>

        <div className="flex flex-col gap-5 overflow-y-auto px-3 py-5">
          {groups.map((group) => (
            <div key={group.key}>
              <div className="text-muted-foreground px-3 pb-1.5 text-[12px] font-semibold">
                {nav[group.key]}
              </div>
              {group.items.map((item) => {
                const active = isNavActive(pathname, item.href)
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    // Ink and a start rule, not a filled pill — the same
                    // measurement that decided the bar: no tint in this palette
                    // clears 3:1 against `sand-50`, so a fill here would be a
                    // shape nobody can see. The rule is the vertical-list
                    // equivalent of the bar's underline.
                    className={`relative flex h-11 items-center gap-3 rounded-full ps-4 pe-3 text-[15px] font-semibold transition-colors ${
                      active
                        ? "text-terracotta-800 before:bg-primary before:absolute before:inset-y-2.5 before:start-0 before:w-[3px] before:rounded-full"
                        : "text-sand-700 hover:text-foreground hover:bg-sand-100"
                    }`}
                  >
                    <item.icon
                      className="size-[18px] shrink-0"
                      strokeWidth={2.3}
                      aria-hidden
                    />
                    {nav[item.key]}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
