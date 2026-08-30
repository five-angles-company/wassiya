import { UserButton } from "@clerk/nextjs"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"

import { LanguageToggle } from "@/components/language-toggle"
import { getLocale } from "@/lib/i18n/server"

/**
 * The top bar: a rail trigger, and the controls that must survive the rail
 * collapsing to icons.
 *
 * A Server Component with client leaves. `ms-auto` rather than `ml-auto` —
 * under RTL this has to push toward the left edge, and only the logical
 * property flips.
 */
export async function AppHeader() {
  const locale = await getLocale()

  return (
    <header className="bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
      <SidebarTrigger className="-ms-1" />
      <Separator
        orientation="vertical"
        className="me-2 data-[orientation=vertical]:h-4"
      />
      <div className="ms-auto flex items-center gap-3">
        <LanguageToggle locale={locale} />
        <Separator
          orientation="vertical"
          className="mx-1 data-[orientation=vertical]:h-4"
        />
        <UserButton />
      </div>
    </header>
  )
}
