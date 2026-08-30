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
 * Unlike the bar, this shows **every** item including the secondary ones — the
 * new-report action, the account, the notifications. The bar can afford to move
 * those into an avatar and a bell because there is room beside them for the
 * reader to notice; a phone has neither the room nor the hover that makes an
 * icon self-explanatory, so here they are named.
 *
 * The section labels come back too. They are what tell a person who is both an
 * heir and a guardian that these are two different jobs.
 *
 * ## Two details that only bite in Arabic
 *
 * `side` comes from the locale rather than the stylesheet: the RTL transform
 * rewrites left/right classNames, but `side` drives `data-[side=left]:left-0`,
 * which no class rewrite reaches. The menu has to open from the edge its
 * trigger sits on, or it flies in across the reader's thumb.
 *
 * And the close button is ours rather than the primitive's. `SheetContent`
 * ships one whose only text is a hardcoded English `sr-only` "Close" — fine in
 * the console, wrong on an Arabic-first surface, and not worth editing a shared
 * shadcn file over.
 *
 * ## Closing on navigation is explicit
 *
 * The sheet is a Radix root with its own open state; a `<Link>` inside it
 * changes the route without Radix ever hearing, so without this the menu would
 * sit open over the page it had just loaded.
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
        className="hover:bg-sand-200 -ms-1.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors md:hidden"
        aria-label={nav.openMenu}
      >
        <MenuIcon className="size-5" strokeWidth={2.3} aria-hidden />
      </SheetTrigger>

      <SheetContent
        side={locale === "ar" ? "right" : "left"}
        showCloseButton={false}
        className="bg-card gap-0 p-0"
      >
        <SheetHeader className="border-border flex-row items-center justify-between gap-3 border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2.5 text-start">
            <span
              aria-hidden
              className="bg-primary text-primary-foreground font-heading grid size-8 shrink-0 place-items-center rounded-[10px] text-[17px] font-black"
            >
              و
            </span>
            <span className="font-heading text-[16px] font-extrabold">
              {nav.appName}
            </span>
          </SheetTitle>
          <SheetClose
            aria-label={nav.closeMenu}
            className="hover:bg-sand-200 inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
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
                    className={`flex h-11 items-center gap-3 rounded-full px-3 text-[15px] font-semibold transition-colors ${
                      active ? "bg-background text-primary" : "hover:bg-sand-200"
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
