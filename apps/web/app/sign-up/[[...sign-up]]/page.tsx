import type { Metadata } from "next"
import { SignUp } from "@clerk/nextjs"

import { AuthShell } from "@/components/auth-shell"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { AUTH } from "@/lib/i18n/strings/auth"
import { safePath } from "@/lib/safe-path"

export async function generateMetadata(): Promise<Metadata> {
  return { title: t(AUTH, await getLocale()).signUpTitle }
}

/**
 * The sign-in page's twin — see its notes on `redirect_url` and `safePath`.
 * Nothing in the app links here any more (sign-in creates accounts too), but
 * old emails and bookmarks do.
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
