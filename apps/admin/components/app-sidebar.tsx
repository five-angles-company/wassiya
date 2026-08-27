"use client"

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
import { ShieldCheckIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
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
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ShieldCheckIcon className="size-4" />
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
        {NAV_GROUPS.map((group) => (
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
                        // board's own grammar settles it: "the selected one is
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
