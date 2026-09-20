import { cookies } from "next/headers"

import { RequirePermission } from "@/components/permission-gate"
import { FillScreen } from "@/components/fill-screen"
import { ClaimsBrowser } from "@/features/claims/components/claims-browser"
import { CLAIMS } from "@/features/claims/strings/claims"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/**
 * The claims workspace — the first of the sidebar's thirteen placeholders to
 * become a real route.
 *
 * Thin, like every route here: it resolves the locale for its heading and hands
 * off to the feature. The browser is a client leaf because it holds the selected
 * status and two Convex subscriptions.
 */
export default async function ClaimsPage() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(CLAIMS, locale)

  return (
    <RequirePermission need="claims.read">
      <FillScreen>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {labels.pageTitle}
        </h1>
        <ClaimsBrowser />
      </FillScreen>
    </RequirePermission>
  )
}
