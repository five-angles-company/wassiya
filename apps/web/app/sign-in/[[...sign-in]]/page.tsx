import { SignIn } from "@clerk/nextjs"

import { AuthShell } from "@/components/auth-shell"
import { safePath } from "@/lib/safe-path"

/**
 * Optional catch-all so Clerk can own its sub-routes (SSO callback, factor
 * steps) under `/sign-in`. Rendering `<SignIn />` here keeps the flow in-app
 * instead of bouncing to Clerk's hosted Account Portal.
 *
 * ## The redirect is the point
 *
 * Every screen in this app is behind the wall, and the two links that matter
 * most arrive by email: a guardian's `/guardian/accept?token=…` and an heir's
 * box. `(app)/layout.tsx` bounces an anonymous visitor here with where they
 * were going in `redirect_url`, and `forceRedirectUrl` takes precedence over
 * every other Clerk redirect source — so they land on the invitation they
 * clicked rather than on a home page that has forgotten the token.
 *
 * `safePath` is not optional: `redirect_url` is a query parameter, so it is
 * writable by whoever composed the link. Without it this component is an open
 * redirect wearing our own domain.
 *
 * The same value rides along on `signUpUrl`, because most guardians and heirs
 * have no account yet and the sign-up link is the one they will actually take.
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
