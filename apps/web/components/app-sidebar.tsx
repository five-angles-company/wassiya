"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { api } from "@workspace/backend/api"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar"
import { useQuery } from "convex/react"

import { useLocale } from "@/components/locale-provider"
import { NAV_GROUPS, type NavItem } from "@/config/nav"
import { fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * The rail, which changes shape depending on who is looking.
 *
 * A Client Component because the active item comes from `usePathname()`. In
 * Next 16 layouts are cached across navigation and do not re-render, so an
 * active state computed in the layout would highlight whichever route happened
 * to be first.
 *
 * ## Two people, one shell
 *
 * `guardianFor` and `claims.mine` decide which groups exist. Someone who guards
 * a vault but has never filed sees no reports section; someone who filed but
 * guards nothing sees no guardianship. Both, either, or neither are all normal
 * — and a section rendered empty would be the worse answer, because on this
 * product an empty "what was left to you" reads as a bereavement, not a state.
 *
 * While either query is in flight both sections render. A rail that appears one
 * group at a time as queries land reads as broken.
 */
export function AppSidebar() {
  const locale = useLocale()
  const nav = t(NAV, locale)
  const pathname = usePathname()

  const guardianships = useQuery(api.guardians.guardianFor, {})
  const claims = useQuery(api.claims.mine, {})
  const unread = useQuery(api.notifications.unreadCount, {})

  const loading = guardianships === undefined || claims === undefined
  const isGuardian = loading || guardianships.length > 0
  const isHeir = loading || claims.length > 0

  const groups = NAV_GROUPS.filter((group) =>
    group.audience === "everyone"
      ? true
      : group.audience === "guardian"
        ? isGuardian
        : isHeir
  )

  return (
    // `side` from the locale rather than the stylesheet: the RTL transform
    // rewrites left/right classNames, but `side` is a variant driving
    // `data-[side=left]:left-0`, which no class rewrite reaches.
    <Sidebar
      side={locale === "ar" ? "right" : "left"}
      variant="inset"
      collapsible="icon"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
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
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.key}>
            <SidebarGroupLabel>{nav[group.key]}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, item)}
                    tooltip={nav[item.key]}
                    className="data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{nav[item.key]}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge === "unread" &&
                    unread !== undefined &&
                    unread > 0 && (
                      <SidebarMenuBadge className="text-primary">
                        {/* `unreadCount` stops counting at ten, so ten is "9+"
                            rather than a number the reader could act on. */}
                        {unread >= 10 ? nav.unreadMany : fmtNumber(unread, locale)}
                      </SidebarMenuBadge>
                    )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}

/**
 * Whether a rail item owns the current path.
 *
 * `/` is matched exactly. A prefix test would make home the active item on
 * every screen in the app, which is not a cosmetic bug: the rail would stop
 * telling the reader where they are.
 *
 * `/claims/new` and `/claims` are siblings under the prefix rule, so the more
 * specific one is checked first and the list yields to it.
 */
function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/") return pathname === "/"
  if (pathname === item.href) return true
  if (!pathname.startsWith(`${item.href}/`)) return false
  return !NAV_GROUPS.some((group) =>
    group.items.some(
      (other) =>
        other.href !== item.href &&
        other.href.startsWith(`${item.href}/`) &&
        (pathname === other.href || pathname.startsWith(`${other.href}/`))
    )
  )
}
