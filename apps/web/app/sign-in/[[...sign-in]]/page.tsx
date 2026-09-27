import type { Metadata } from "next"
import { SignIn } from "@clerk/nextjs"

import { AuthShell } from "@/components/auth-shell"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { AUTH } from "@/lib/i18n/strings/auth"
import { safePath } from "@/lib/safe-path"

export async function generateMetadata(): Promise<Metadata> {
  return { title: t(AUTH, await getLocale()).signInTitle }
}

/**
 * Optional catch-all so Clerk can own its sub-routes (SSO callback, factor
 * steps, and the sign-up steps of the combined flow) under `/sign-in`.
 * Rendering `<SignIn />` here keeps the flow in-app instead of bouncing to
 * Clerk's hosted Account Portal.
 *
 * **`withSignUp` is set explicitly.** Most reporters and executors have no
 * account yet, and the root layout hides Clerk's footer — which is where the
 * separate "Sign up" link lives. The combined flow asks for an email and then
 * signs in or creates the account, so a first-time reader can never reach a
 * dead end. Left to Clerk's default it depends on an env var being set.
 *
 * **`safePath` is not optional**: `redirect_url` is a query parameter, writable
 * by whoever composed the link. Without it this component is an open redirect
 * wearing our own domain.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>
}) {
  const to = safePath((await searchParams).redirect_url)

  return (
    <AuthShell>
      <SignIn withSignUp forceRedirectUrl={to} signUpForceRedirectUrl={to} />
    </AuthShell>
  )
}
