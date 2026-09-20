"use client"

import { useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar"

import { BrandMark } from "@/components/brand-mark"
import { useLocale } from "@/components/locale-provider"
import { usePermissions } from "@/hooks/use-permissions"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { NAV } from "@/lib/i18n/strings/nav"
import { NAV_GROUPS } from "@/config/nav"

/**
 * The console's navigation.
 *
 * A Client Component because the active item comes from `usePathname()`. In
 * Next 16 layouts are cached across navigation and do not re-render, so an
 * active state computed in the layout would highlight whichever route happened
 * to be first.
 *
 * `side` is set from the locale rather than left to the stylesheet. The shadcn
 * RTL transform rewrites `left`/`right` *classNames* into logical properties,
 * but `side` is a variant that drives `data-[side=left]:left-0` — a physical
 * offset by design, since a sidebar's side is a layout decision and not a
 * writing-direction one. In Arabic the console reads from the right, so that is
 * where the navigation belongs.
 */
export function AppSidebar() {
  const locale = useLocale()
  const pathname = usePathname()
  const nav = t(NAV, locale)
  const common = t(COMMON, locale)
  const { has } = usePermissions()

  // Filtered, not disabled. A console that shows a delivery agent every screen
  // they cannot open is a console that reads as broken rather than scoped — and
  // a group heading with nothing under it is worse than no heading, so an empty
  // group goes with its items.
  const groups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => has(item.need)),
      })).filter((group) => group.items.length > 0),
    [has]
  )

  return (
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
                {/* The mark carries the accent itself, so the tile it used to
                    sit in is gone — a solid terracotta square here and a solid
                    terracotta active row below were two accents on one screen.
                    It narrows to 32px when the rail collapses because that is
                    what the button becomes, and the button clips. */}
                <div className="flex w-11 shrink-0 items-center justify-center group-data-[collapsible=icon]:w-8">
                  <BrandMark />
                </div>
                <div className="grid flex-1 text-start leading-tight">
                  <span className="truncate font-heading font-semibold">
                    {common.appName}
                  </span>
                  <span className="truncate text-xs opacity-70">
                    {common.consoleName}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.key}>
            <SidebarGroupLabel>{nav[group.key]}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const label = nav[item.key]
                  const Icon = item.icon

                  // A placeholder is a disabled button, not an <a href="#">.
                  // Nothing to click means nothing should look clickable, and a
                  // screen reader should hear "unavailable" rather than "link".
                  if (item.href === null) {
                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          disabled
                          tooltip={`${label} — ${common.comingSoon}`}
                          className="cursor-not-allowed opacity-60"
                        >
                          <Icon />
                          <span>{label}</span>
                        </SidebarMenuButton>
                        <SidebarMenuBadge className="opacity-60">
                          {common.comingSoon}
                        </SidebarMenuBadge>
                      </SidebarMenuItem>
                    )
                  }

                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={label}
                        // Upstream paints the active item with
                        // `bg-sidebar-accent` — the same token as hover, told
                        // apart only by `font-medium`. In a sidebar where all
                        // but one item is disabled that reads as nothing. The
                        // the vault grammar settles it: "the selected one is
                        // solid terracotta". twMerge drops the upstream
                        // `data-active:bg-*` in favour of these.
                        className="data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground"
                      >
                        <Link href={item.href}>
                          <Icon />
                          <span>{label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* No footer: language, theme and account moved to the top bar, where they
          survive the rail collapsing to icons. See `app-header.tsx`. */}
      <SidebarRail />
    </Sidebar>
  )
}
