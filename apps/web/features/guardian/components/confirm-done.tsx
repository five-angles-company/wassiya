"use client"

import { CheckIcon } from "lucide-react"

import { ButtonLink } from "@/components/button"
import { Panel } from "@/components/panel"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

/**
 * The receipt for a confirmation.
 *
 * It lives one level up from `ConfirmPanel`, in `GuardianClaim`, for a reason
 * that is not stylistic: `guardianConfirm` moves the claim from
 * `guardian_review` to `awaiting_veto`, and `pendingApprovals` queries only
 * `guardian_review` and `released`. So the instant the mutation lands the duty
 * row leaves the list the panel was found in.
 *
 * Held inside `ConfirmPanel`, that meant a guardian tapped "أؤكّد الوفاة" and
 * watched the screen replace itself with "لم نجد هذا" — a not-found error on
 * the single action the whole role exists for. The confirmed state has to
 * outlive the query that produced the panel.
 */
export function ConfirmDone() {
  const labels = t(GUARDIAN_DUTIES, useLocale())

  return (
    <Panel tone="settled" icon={CheckIcon} title={labels.confirmDone}>
      <p className="mb-6 max-w-[62ch] text-[14.5px] leading-[1.72] opacity-90">
        {labels.confirmWhatHappens}
      </p>
      <ButtonLink href="/guardian" variant="inverse">
        {labels.title}
      </ButtonLink>
    </Panel>
  )
}
