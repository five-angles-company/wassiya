import { UserButton } from "@clerk/nextjs"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"

import { LocaleToggle } from "@/components/locale-toggle"
import { ThemeToggle } from "@/components/theme-toggle"

/**
 * The console's top bar.
 *
 * The three switchers — language, theme, account — live here rather than in the
 * sidebar footer. Two reasons: the sidebar collapses to icons, which is exactly
 * when a two-button language pill has nowhere to go; and these act on the whole
 * console rather than navigating within it, so grouping them with the nav
 * implied they were part of it.
 *
 * A Server Component that happens to render client leaves. Each switcher owns
 * its own `"use client"`, so nothing here has to.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger className="-ms-1" />
      <Separator
        orientation="vertical"
        className="me-2 data-[orientation=vertical]:h-4"
      />

      {/* `ms-auto` rather than `ml-auto`: under RTL this has to push toward the
          left edge, and the logical property is what flips it. */}
      <div className="ms-auto flex items-center gap-2">
        <LocaleToggle />
        <ThemeToggle />
        <Separator
          orientation="vertical"
          className="mx-1 data-[orientation=vertical]:h-4"
        />
        <UserButton />
      </div>
    </header>
  )
}
