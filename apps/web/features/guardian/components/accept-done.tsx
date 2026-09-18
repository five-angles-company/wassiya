"use client"

import type { GuardianKeySheet } from "@workspace/crypto/guardianKey"

import { ButtonLink } from "@/components/button"
import { DocSection } from "@/components/doc/section"
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
 * ## ⚠️ The offer is still here, but only for the road that did not take it
 *
 * It used to be here unconditionally, *"for a reason that is not layout: before
 * `guardians.accept` succeeds there is no guardianship for a stored key to
 * belong to, and a device holding a key for an invitation that was never spent
 * would be a small lie the reader could not see."*
 *
 * A guardian who proved themselves by fingerprint sealed the copy **before**
 * `accept` — it is what `accept` was waiting for — so offering again would ask
 * them to do a thing they have just done. A guardian who typed the code back has
 * no copy on this device and gets the offer exactly as before, which is also
 * when the old reason still applies in full: the invitation is spent by the time
 * they see it.
 */
export function AcceptDone({
  labels,
  sheet,
  keptOnDevice,
}: {
  labels: Resolved<typeof GUARDIAN>
  sheet: GuardianKeySheet
  /** True when the seal was the proof that let `accept` run. */
  keptOnDevice: boolean
}) {
  return (
    <DocSection title={labels.doneTitle}>
      <p className="text-muted-foreground mb-6 max-w-[66ch] text-[15px] leading-[1.72]">
        {labels.doneBody}
      </p>
      <ButtonLink href="/guardian" variant="secondary" size="lg">
        {labels.doneAction}
      </ButtonLink>

      {!keptOnDevice && <KeepOnDevice sheet={sheet} />}
    </DocSection>
  )
}
