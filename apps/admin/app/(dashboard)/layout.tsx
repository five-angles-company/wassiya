import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import { AdminGate } from "@/components/admin-gate"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"

/**
 * The console shell: everything behind the sign-in wall. A route group, so
 * `/sign-in` and `/sign-up` sit outside it and stay bare centred cards.
 *
 * Three gates, answering different questions. `await auth()` answers "is anyone
 * signed in?" — a Clerk fact available on the server, and the cheapest way to
 * bounce an anonymous visitor before any markup is generated. It cannot answer
 * "is this an admin?", because `role` lives in the Convex `users` table and
 * never enters the JWT; `AdminGate` does that client-side off Convex's own auth
 * state. **`requireAdmin`, which throws inside every admin function, is the only
 * one of the three that is load-bearing.**
 *
 * `TooltipProvider` is required rather than optional: `SidebarMenuButton`
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
        {/*
          The shell is exactly one viewport tall, and the scrolling happens
          inside it.

          `SidebarProvider` ships `min-h-svh`, which lets a long page grow the
          document — so a hundred-row table pushed its own pager below the fold
          and took the toolbar with it. Pinning the height here means the
          sidebar and the header never move, and the region below owns the
          scroll.

          `min-h-0` on each link of the chain is what makes that work: a flex
          child defaults to `min-height: auto` and refuses to shrink below its
          content, so without it every `flex-1` below is a lie.
        */}
        <SidebarProvider className="h-svh overflow-hidden">
          <AppSidebar />
          {/* Flush and square. The `inset` variant floats the content on a
              margin with `rounded-xl`, which put a gap and two rounded corners
              above a header that is meant to sit against the top of the window.
              The rail keeps its own inset padding; only the panel is squared. */}
          <SidebarInset className="min-h-0 md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none">
            <AppHeader />
            {/*
              A plain scrolling column, not a flex one.

              It was a flex column so that a table could claim the leftover
              height — and that quietly broke every other page, because a flex
              child defaults to `flex-shrink: 1`. The dashboard's cards and
              charts compressed to fit the viewport instead of overflowing it,
              so they showed half their content *and* the region never scrolled,
              because nothing ever grew past it.

              Blocks do not shrink, so panels keep their natural height and this
              region scrolls the ordinary way. The pages that want the other
              behaviour ask for it, with `FillScreen`.
            */}
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
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
