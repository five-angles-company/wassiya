"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"

import { RecordNotFound } from "@/components/record-not-found"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { ConfirmDone } from "@/features/guardian/components/confirm-done"
import { ConfirmPanel } from "@/features/guardian/components/confirm-panel"
import { HandoverPanel } from "@/features/guardian/components/handover-panel"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

/**
 * One claim, from the guardian's side.
 *
 * Reads `pendingApprovals` rather than the claim: there is no guardian-facing
 * single-claim query, and adding one would mean a second place deciding what a
 * guardian may see about a vault they do not own. `pendingApprovals` already
 * gates on an accepted guardianship and carries the four fields needed.
 *
 * **`confirmed` is held above the subscription, and that is load-bearing.**
 * `guardianConfirm` moves the claim from `guardian_review` to `awaiting_veto`,
 * and `pendingApprovals` queries only `guardian_review` and `released` — so the
 * duty row disappears the instant the mutation lands and the `find` below
 * returns `undefined`. Without it the guardian would tap "أؤكّد الوفاة" and be
 * shown "لم نجد هذا". A claim that is no longer a duty and was not just
 * confirmed here is genuinely not found, and that case is correct.
 *
 * Handover has no equivalent edge: a `released` claim stays `released`.
 */
export function GuardianClaim({ claimId }: { claimId: string }) {
  const locale = useLocale()
  const labels = t(GUARDIAN_DUTIES, locale)
  const common = t(COMMON, locale)
  const duties = useQuery(api.guardians.pendingApprovals, {})
  const [confirmed, setConfirmed] = useState(false)

  if (confirmed) return <ConfirmDone />

  if (duties === undefined) {
    return <p className="text-muted-foreground text-[14.5px]">{common.loading}</p>
  }

  const duty = duties.find((row) => row.claimId === claimId)
  if (duty === undefined) {
    return (
      <RecordNotFound
        id={claimId}
        backHref="/guardian"
        backLabel={labels.title}
      />
    )
  }

  const subjectName = duty.subjectName ?? "—"

  return duty.duty === "confirm" ? (
    <ConfirmPanel
      claimId={duty.claimId}
      subjectName={subjectName}
      claimantName={duty.claimantName}
      certificateName={duty.certificateName}
      nameMatch={duty.nameMatch}
      heirLinked={duty.heirLinked}
      onConfirmed={() => setConfirmed(true)}
    />
  ) : (
    <HandoverPanel claimId={duty.claimId} subjectName={subjectName} />
  )
}
