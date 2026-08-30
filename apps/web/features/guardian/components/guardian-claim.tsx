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
 * ## Why this reads `pendingApprovals` rather than the claim
 *
 * There is no guardian-facing query for a single claim, and adding one would
 * mean a second place that decides what a guardian may see about a vault they
 * do not own. `pendingApprovals` already answers exactly that question, already
 * gates on an accepted guardianship, and already carries the four fields this
 * screen needs. Finding the row in it costs one filter over a list that is
 * almost always length 0 or 1.
 *
 * ## The confirmed state has to outlive the query
 *
 * That choice has one sharp edge, and it is on the single action this whole
 * role exists for. `guardianConfirm` moves the claim from `guardian_review` to
 * `awaiting_veto`; `pendingApprovals` queries only `guardian_review` and
 * `released`. So the duty row disappears the instant the mutation lands, the
 * `find` below returns `undefined`, and without `confirmed` the guardian would
 * tap "أؤكّد الوفاة" and be shown **"لم نجد هذا"**.
 *
 * `confirmed` is held here, above the subscription, so the receipt survives the
 * row that produced it. A claim that is no longer a duty and was *not* just
 * confirmed here is genuinely not found — that case is correct, and the row
 * leaving the list is its own receipt on a return visit.
 *
 * Handover has no equivalent edge: a `released` claim stays `released`, so its
 * row is still there afterwards.
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
