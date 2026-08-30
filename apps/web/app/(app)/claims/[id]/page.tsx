import { ClaimDetail } from "@/features/claims/components/claim-detail"

/**
 * One report.
 *
 * `params` is a promise in Next 16 — synchronous access was removed, not just
 * deprecated. The id goes through as a string: `claims.publicStatus` takes
 * `v.string()` and normalises it in the handler, because this id arrives from
 * an emailed link and mail clients truncate them.
 */
export default async function ClaimPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ClaimDetail claimId={id} />
}
