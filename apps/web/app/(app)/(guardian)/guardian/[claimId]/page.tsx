import { GuardianClaim } from "@/features/guardian/components/guardian-claim"

/** One claim, from the guardian's side: confirm it, or hand over their half. */
export default async function GuardianClaimPage({
  params,
}: {
  params: Promise<{ claimId: string }>
}) {
  const { claimId } = await params
  return <GuardianClaim claimId={claimId} />
}
