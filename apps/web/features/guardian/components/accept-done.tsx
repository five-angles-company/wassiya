"use client"

import type { GuardianKeySheet } from "@workspace/crypto/guardianKey"
import { CheckIcon } from "lucide-react"

import { ButtonLink } from "@/components/button"
import { Panel } from "@/components/panel"
import type { Resolved } from "@/lib/i18n/locale"
import { KeepOnDevice } from "@/features/guardian/components/keep-on-device"
import type { GUARDIAN } from "@/features/guardian/strings/guardian"

/**
 * Accepted.
 *
 * The copy's job is to set an expectation that will hold for years: nothing is
 * required until we ask, and we probably will not ask soon. A guardian who
 * leaves this screen expecting periodic activity is one who stops reading our
 * email.
 *
 * The offer to keep a copy on this device belongs here rather than a screen
 * earlier, for a reason that is not layout: before `guardians.accept` succeeds
 * there is no guardianship for a stored key to belong to, and a device holding
 * a key for an invitation that was never spent would be a small lie the reader
 * could not see.
 */
export function AcceptDone({
  labels,
  sheet,
}: {
  labels: Resolved<typeof GUARDIAN>
  sheet: GuardianKeySheet
}) {
  return (
    <Panel tone="settled" icon={CheckIcon} title={labels.doneTitle}>
      <p className="mb-6 max-w-[62ch] text-[15px] leading-[1.72] opacity-90">
        {labels.doneBody}
      </p>
      <ButtonLink href="/guardian" variant="inverse" size="lg">
        {labels.doneAction}
      </ButtonLink>

      <KeepOnDevice sheet={sheet} />
    </Panel>
  )
}
