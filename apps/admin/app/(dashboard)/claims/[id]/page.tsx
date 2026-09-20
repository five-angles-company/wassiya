import { cookies } from "next/headers"

import { RequirePermission } from "@/components/permission-gate"
import { ClaimReview } from "@/features/claims/components/claim-review"
import { CLAIMS } from "@/features/claims/strings/claims"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/**
 * One claim, where the review happens.
 *
 * `params` is a promise in Next 16 — synchronous access was removed, not just
 * deprecated. The id is passed through as a string and cast inside the feature,
 * so nothing here needs the Convex types.
 */
export default async function ClaimReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(CLAIMS, locale)

  return (
    <RequirePermission need="claims.read">
      <>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {labels.reviewTitle}
        </h1>
        <ClaimReview claimId={id} />
      </>
    </RequirePermission>
  )
}
