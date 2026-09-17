"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { useMutation } from "convex/react"
import { UserCheckIcon } from "lucide-react"

import { Button } from "@/components/button"
import { Panel } from "@/components/panel"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

/**
 * The guardian confirms a death.
 *
 * The copy says plainly that this starts a thirty-day veto window, delivers
 * nothing today, and is not a legal declaration — because a guardian who
 * believes they are handing over an estate will hesitate, and one who believes
 * it is a formality will tap without thinking.
 *
 * Success is reported upward rather than held here: `guardianConfirm` moves the
 * claim out of `guardian_review`, one of the two states `pendingApprovals`
 * queries, so this component's own row vanishes the moment it succeeds.
 * `onConfirmed` hands the fact to a parent that outlives the query.
 *
 * ⚠️ **There is deliberately no self-signing check.** Refusing a confirmation
 * when the confirmer is also the claimant would block every claim once the
 * guardian *is* the claimant, which is a supported case. What holds the
 * heir-guardian case is the certificate, the staff name-match, the veto window
 * and the heir's own identity verification.
 */
export function ConfirmPanel({
  claimId,
  subjectName,
  claimantName,
  certificateName,
  nameMatch,
  heirLinked,
  onConfirmed,
}: {
  claimId: string
  subjectName: string
  claimantName: string
  certificateName: string | null
  nameMatch: boolean | null
  heirLinked: boolean
  onConfirmed: () => void
}) {
  const labels = t(GUARDIAN_DUTIES, useLocale())
  const confirm = useMutation(api.claims.guardianConfirm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function act() {
    setBusy(true)
    setError(null)
    try {
      await confirm({ claimId: claimId as Id<"claims"> })
      onConfirmed()
    } catch {
      setError(labels.confirmFailed)
      setBusy(false)
    }
    // No `finally`: on success this component is already being replaced, and
    // clearing `busy` there would re-enable the button for the frame before it
    // unmounts — on a mutation that refuses a second call anyway, but which
    // should never look retryable.
  }

  return (
    <Panel
      accent={heirLinked ? "primary" : undefined}
      icon={UserCheckIcon}
      title={labels.dutyConfirmTitle.replace("{name}", subjectName)}
    >
      <dl className="mb-5 flex flex-col gap-2 text-[14px]">
        <Row label={labels.claimantIs} value={claimantName} />
        {certificateName !== null && (
          <Row label={labels.certificateFor} value={certificateName} />
        )}
      </dl>

      {nameMatch === null ? (
        <p className="mb-5 text-[13.5px] leading-[1.7] opacity-70">
          {labels.nameMatchPending}
        </p>
      ) : nameMatch ? null : (
        <p className="mb-5 text-[13.5px] leading-[1.7] opacity-70">
          {labels.nameMatchFailed}
        </p>
      )}

      {!heirLinked ? (
        <>
          <h3 className="text-[15px] font-semibold">{labels.notLinkedTitle}</h3>
          <p className="text-muted-foreground mt-2 max-w-[62ch] text-[14px] leading-[1.7]">
            {labels.notLinkedBody}
          </p>
        </>
      ) : (
        <>
          <h3 className="text-[16px] font-semibold">{labels.confirmTitle}</h3>
          <p className="mt-2 max-w-[62ch] text-[14.5px] leading-[1.72] opacity-80">
            {labels.confirmBody}
          </p>
          <p className="mt-3 max-w-[62ch] text-[14px] leading-[1.7] opacity-70">
            {labels.confirmWhatHappens}
          </p>

          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => void act()}
            disabled={busy}
          >
            {busy ? labels.confirmBusy : labels.confirmAction}
          </Button>

          {error !== null && (
            <p className="mt-4 text-[14px] leading-[1.7]">{error}</p>
          )}
        </>
      )}
    </Panel>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <dt className="opacity-60">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}
