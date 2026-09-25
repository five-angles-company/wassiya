"use client"

import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import { useMutation } from "convex/react"
import { InfoIcon } from "lucide-react"
import { toast } from "sonner"

import { usePermissions } from "@/hooks/use-permissions"
import { ConfirmAction } from "@/components/confirm-action"
import { CLAIMS } from "@/features/claims/strings/claims"
import { t, type Locale } from "@/lib/i18n/locale"

/** Why a verdict is unavailable, as `nameMatchBlockedReason` names it. */
export type VerdictBlocked = {
  approve: "past-review" | null
  reject: "past-review" | null
}

/** The refusal reasons, in the operator's language. */
function blockedLabel(
  reason: VerdictBlocked["approve"],
  labels: ReturnType<typeof t<typeof CLAIMS>>
): string | undefined {
  return reason === "past-review" ? labels.blockedPastReview : undefined
}

/**
 * The irreversible decision.
 *
 * Approve and reject are **not** symmetric and the dialog says so: rejecting
 * sends the claim to `locked` with a 90-day bar on the claimant, and
 * `nameMatchBlockedReason` answers `"past-review"` for every later call — no
 * admin path moves it back. So reject wears the destructive tone and approve
 * does not, which is what keeps the two from being clicked interchangeably.
 *
 * Each button carries its own refusal reason rather than being merely disabled.
 * A greyed-out approve with no explanation is the same screen for "no heir
 * linked yet" and "someone already ruled on this", and those need different
 * next actions from the reviewer.
 */
export function ClaimVerdict({
  claimId,
  blocked,
  locale,
}: {
  claimId: string
  blocked: VerdictBlocked
  locale: Locale
}) {
  const labels = t(CLAIMS, locale)
  const { has } = usePermissions()
  const setNameMatch = useMutation(api.claims.adminSetNameMatch)

  async function rule(nameMatch: boolean, success: string) {
    try {
      await setNameMatch({ claimId: claimId as Id<"claims">, nameMatch })
      toast.success(success)
    } catch (error) {
      // The server's message is the useful one — it names which precondition
      // failed — so it is shown rather than replaced with a generic apology.
      toast.error(error instanceof Error ? error.message : labels.toastFailed)
    }
  }

  // Absent rather than disabled: a greyed-out control invites "why can't I?",
  // an absent one reads as "not my job". The refusal is in the mutation.
  if (!has("claims.rule")) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <ConfirmAction
          tone="neutral"
          title={labels.approveDialogTitle}
          body={labels.approveDialogBody}
          confirmLabel={labels.approveConfirm}
          cancelLabel={labels.cancel}
          onConfirm={() => rule(true, labels.toastApproved)}
          trigger={
            <Button className="w-full" disabled={blocked.approve !== null}>
              {labels.approve}
            </Button>
          }
        />
        <ConfirmAction
          tone="destructive"
          title={labels.rejectDialogTitle}
          body={labels.rejectDialogBody}
          confirmLabel={labels.rejectConfirm}
          cancelLabel={labels.cancel}
          onConfirm={() => rule(false, labels.toastRejected)}
          trigger={
            <Button
              variant="outline"
              className="w-full text-destructive"
              disabled={blocked.reject !== null}
            >
              {labels.reject}
            </Button>
          }
        />
      </div>

      {blockedLabel(blocked.approve, labels) !== undefined && (
        <p className="text-sm text-muted-foreground">
          {blockedLabel(blocked.approve, labels)}
        </p>
      )}

      <div className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
        <span>{labels.approveNextBody}</span>
      </div>
    </div>
  )
}
