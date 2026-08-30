import { SignUp } from "@clerk/nextjs"

import { AuthShell } from "@/components/auth-shell"
import { safePath } from "@/lib/safe-path"

/**
 * The sign-in page's twin — see its notes on `redirect_url` and `safePath`.
 *
 * Optional catch-all for the same reason: Clerk owns its verification
 * sub-routes under `/sign-up`.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>
}) {
  const to = safePath((await searchParams).redirect_url)

  return (
    <AuthShell>
      <SignUp
        forceRedirectUrl={to}
        signInUrl={`/sign-in?redirect_url=${encodeURIComponent(to)}`}
      />
    </AuthShell>
  )
}
