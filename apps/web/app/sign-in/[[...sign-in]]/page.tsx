import { SignIn } from "@clerk/nextjs"

import { AuthShell } from "@/components/auth-shell"
import { safePath } from "@/lib/safe-path"

/**
 * Optional catch-all so Clerk can own its sub-routes (SSO callback, factor
 * steps) under `/sign-in`. Rendering `<SignIn />` here keeps the flow in-app
 * instead of bouncing to Clerk's hosted Account Portal.
 *
 * Every screen in this app is behind the wall and the two links that matter most
 * arrive by email, so `(app)/layout.tsx` bounces an anonymous visitor here with
 * where they were going in `redirect_url`, and `forceRedirectUrl` takes
 * precedence over every other Clerk redirect source.
 *
 * **`safePath` is not optional**: `redirect_url` is a query parameter, writable
 * by whoever composed the link. Without it this component is an open redirect
 * wearing our own domain.
 *
 * The same value rides along on `signUpUrl`, because most reporters and heirs
 * have no account yet.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>
}) {
  const to = safePath((await searchParams).redirect_url)

  return (
    <AuthShell>
      <SignIn
        forceRedirectUrl={to}
        signUpUrl={`/sign-up?redirect_url=${encodeURIComponent(to)}`}
      />
    </AuthShell>
  )
}
