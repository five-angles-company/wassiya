"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"

import { RecordNotFound } from "@/components/record-not-found"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { ConfirmPanel } from "@/features/guardian/components/confirm-panel"
import { HandoverPanel } from "@/features/guardian/components/handover-panel"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

/**
 * One claim, from the guardian's side.
 *
 * ## Why this reads `pendingApprovals` rather than the claim
 *
 * There is no guardian-facing query for a single claim, and adding one would
 * mean a second place that decides what a guardian may see about a vault they
 * do not own. `pendingApprovals` already answers exactly that question, already
 * gates on an accepted guardianship, and already carries the four fields this
 * screen needs. Finding the row in it costs one filter over a list that is
 * almost always length 0 or 1.
 *
 * The consequence is the honest one: a claim that is no longer a duty is not
 * found here. That is correct — a guardian who has already confirmed has
 * nothing left to do on it, and the row leaving the list *is* the receipt.
 */
export function GuardianClaim({ claimId }: { claimId: string }) {
  const locale = useLocale()
  const labels = t(GUARDIAN_DUTIES, locale)
  const common = t(COMMON, locale)
  const duties = useQuery(api.guardians.pendingApprovals, {})

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
    />
  ) : (
    <HandoverPanel claimId={duty.claimId} subjectName={subjectName} />
  )
}
