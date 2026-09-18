"use client"

import { Button } from "@/components/button"
import { Prose } from "@/components/doc/prose"
import { DocTitle } from "@/components/doc/title"
import type { Resolved } from "@/lib/i18n/locale"
import type { GuardianKeySheet } from "@workspace/crypto/guardianKey"
import { KeySheet } from "@/features/guardian/components/key-sheet"
import type { GUARDIAN } from "@/features/guardian/strings/guardian"

/**
 * The key, and nothing else.
 *
 * ## One decision per screen
 *
 * This used to carry the key, the print and copy actions, the offer to seal it
 * to the device, the outcome of a failed seal, and a link past all of it. Five
 * things, three of them actionable, with nothing saying which mattered — so the
 * reader had to work out the order the screen would not tell them.
 *
 * Now it asks one thing: **get this onto paper**. Sealing it to the device is
 * the screen after, which is also the true order — the paper is the durable
 * copy and the device copy is a convenience laid on top of it.
 *
 * `KeySheet` owns the code, the print button and the copy button, so the actions
 * that belong to the key sit with the key rather than under it.
 */
export function AcceptSheet({
  labels,
  sheet,
  busy,
  onNext,
}: {
  labels: Resolved<typeof GUARDIAN>
  sheet: GuardianKeySheet
  busy: boolean
  onNext: () => void
}) {
  return (
    <article className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <DocTitle
          title={`${labels.keyTitleOne} ${labels.keyTitleTwo}`}
          meta={labels.createdNow}
        />
        <Prose>
          <p>{labels.keyLede}</p>
        </Prose>
      </div>

      <KeySheet code={sheet.code} />

      {/* Worded as a claim the reader makes — "saved it" — rather than a bare
          "next". The whole screen rests on them having actually done it, and a
          neutral button lets someone move on without ever deciding. */}
      <Button
        variant="secondary"
        size="lg"
        className="self-start"
        onClick={onNext}
        disabled={busy}
      >
        {labels.sheetNext}
      </Button>
    </article>
  )
}
