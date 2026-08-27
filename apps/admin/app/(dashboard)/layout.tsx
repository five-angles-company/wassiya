import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import { AdminGate } from "@/components/admin-gate"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"

/**
 * The console shell: everything behind the sign-in wall.
 *
 * A route group so `/sign-in` and `/sign-up` keep rendering as bare centred
 * cards — they sit outside this folder and inherit only the root layout.
 *
 * ## Two gates, because they answer different questions
 *
 * `await auth()` answers *"is anyone signed in?"* — a Clerk fact, available on
 * the server, and the cheapest way to bounce an anonymous visitor before any
 * console markup is generated. This is the repo's first use of the pattern
 * `AGENTS.md` prescribes ("protect the resource... in the page, layout, or
 * route handler"), and `isAuthenticated` is the discriminant the installed
 * `@clerk/backend` actually exposes.
 *
 * It cannot answer *"is this an admin?"*, because `role` lives in the Convex
 * `users` table and never enters the JWT. `AdminGate` does that, client-side,
 * off Convex's own auth state. And behind both, `requireAdmin` throws inside
 * every admin function — which is the only one of the three that is load-bearing.
 *
 * `TooltipProvider` is required here rather than optional: `SidebarMenuButton`
 * renders a `Tooltip` whenever the rail is collapsed, and this package's
 * `Tooltip` is a bare Radix root with no provider of its own.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) redirect("/sign-in")

  return (
    <AdminGate>
      <TooltipProvider delayDuration={0}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <AppHeader />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
              {children}
            </div>
            {/* Action feedback for the claim review. Mounted inside the shell
                rather than the root layout so it inherits the console's palette
                and direction, and so the sign-in pages carry no toaster. */}
            <Toaster position="bottom-center" richColors />
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </AdminGate>
  )
}
