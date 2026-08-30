"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"
import { BellIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * Notifications, as a bell in the bar's controls.
 *
 * The rail could afford a labelled row with a count beside it; a bar cannot, so
 * this is the one nav item that becomes an icon. It earns that: a bell with a
 * count is the single most legible control in any application chrome, and the
 * label is still spelled out in the mobile menu and on `aria-label` for anyone
 * reading with a screen reader.
 *
 * Active is a colour change, not a fill — the same reasoning as the links, and
 * the same numbers: no tint in this palette clears 3:1 against the near-white
 * bar, so a filled circle here would be a shape nobody can see.
 *
 * The badge keeps the **solid** primary while nothing else in the chrome does,
 * and that is the point: an unread count is the one thing in this bar asking
 * for something. `unreadCount` stops at ten, so ten renders as "٩+" — a number
 * past that would be precision the query never had.
 */
export function NotificationBell() {
  const locale = useLocale()
  const nav = t(NAV, locale)
  const pathname = usePathname()
  const unread = useQuery(api.notifications.unreadCount, {})

  const active = pathname === "/notifications"
  const count = unread ?? 0

  return (
    <Link
      href="/notifications"
      aria-label={nav.notifications}
      aria-current={active ? "page" : undefined}
      className={`hover:bg-sand-100 relative inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors ${
        active
          ? "text-terracotta-800"
          : "text-sand-700 hover:text-foreground"
      }`}
    >
      <BellIcon className="size-[18px]" strokeWidth={2.3} aria-hidden />
      {count > 0 && (
        // `-top-0.5 -end-0.5`: logical, so the badge stays on the outer corner
        // when the whole bar mirrors under RTL.
        <span
          aria-hidden
          className="bg-primary text-primary-foreground absolute -top-0.5 -end-0.5 grid min-w-[18px] place-items-center rounded-full px-1 text-[10.5px] font-bold tabular-nums"
        >
          {count >= 10 ? nav.unreadMany : fmtNumber(count, locale)}
        </span>
      )}
    </Link>
  )
}
