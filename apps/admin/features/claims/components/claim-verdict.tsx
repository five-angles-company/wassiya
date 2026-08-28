"use client"

import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { useMutation } from "convex/react"
import { InfoIcon } from "lucide-react"
import { toast } from "sonner"

import { ConfirmAction } from "@/components/confirm-action"
import { CLAIMS } from "@/features/claims/strings/claims"
import { t, type Locale } from "@/lib/i18n/locale"

/** Why a verdict is unavailable, as `nameMatchBlockedReason` names it. */
export type VerdictBlocked = {
  approve: string | null
  reject: string | null
}

/** The three refusal reasons, in the operator's language. */
function blockedLabel(
  reason: string | null,
  labels: ReturnType<typeof t<typeof CLAIMS>>
): string | undefined {
  if (reason === "no-heir") return labels.blockedNoHeir
  if (reason === "identity-not-verified") return labels.blockedIdentity
  if (reason === "past-review") return labels.blockedPastReview
  return undefined
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">
          {labels.verdictTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <ConfirmAction
            tone="neutral"
            title={labels.approveDialogTitle}
            body={labels.approveDialogBody}
            confirmLabel={labels.approveConfirm}
            cancelLabel={labels.cancel}
            onConfirm={() => rule(true, labels.toastApproved)}
            trigger={
              <Button disabled={blocked.approve !== null}>
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
              <Button variant="destructive" disabled={blocked.reject !== null}>
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

        {/* The dead end, named on the screen rather than discovered later. */}
        <div className="flex gap-2 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <span className="font-medium">{labels.guardianGapTitle}. </span>
            {labels.guardianGapBody}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
