import { RequirePermission } from "@/components/permission-gate"
import { ClaimReview } from "@/features/claims/components/claim-review"

/** `params` is a promise in Next 16; the id is forwarded as a raw string. */
export default async function ClaimReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <RequirePermission need="claims.read">
      <ClaimReview claimId={id} />
    </RequirePermission>
  )
}
