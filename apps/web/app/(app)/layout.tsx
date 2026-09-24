import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

import { AuthGate } from "@/components/auth-gate"
import { PageColumn } from "@/components/page-column"
import { safePath } from "@/lib/safe-path"

/**
 * Signed-in screens. The redirect protects the page render; the data is
 * protected separately, by `ctx.auth` in every Convex function it reads.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) {
    const here = safePath((await headers()).get("x-pathname"))
    redirect(`/sign-in?redirect_url=${encodeURIComponent(here)}`)
  }

  return (
    <PageColumn>
      <AuthGate>{children}</AuthGate>
    </PageColumn>
  )
}
