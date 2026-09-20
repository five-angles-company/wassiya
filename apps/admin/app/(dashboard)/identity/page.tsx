import { cookies } from "next/headers"

import { RequirePermission } from "@/components/permission-gate"
import { FillScreen } from "@/components/fill-screen"
import { IdentityBrowser } from "@/features/identity/components/identity-browser"
import { IDENTITY } from "@/features/identity/strings/identity"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/**
 * The identity queue. Thin, like every route here: it resolves the locale for
 * its heading and hands off to the feature.
 */
export default async function IdentityPage() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(IDENTITY, locale)

  return (
    <RequirePermission need="identity.read">
      <FillScreen>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {labels.pageTitle}
        </h1>
        <IdentityBrowser />
      </FillScreen>
    </RequirePermission>
  )
}
