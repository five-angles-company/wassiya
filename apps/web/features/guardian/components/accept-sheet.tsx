"use client"

import type { GuardianKeySheet } from "@workspace/crypto/guardianKey"
import { ArrowRightIcon } from "lucide-react"

import type { Resolved } from "@/lib/i18n/locale"
import { KeySheet } from "@/features/guardian/components/key-sheet"
import type { GUARDIAN } from "@/features/guardian/strings/guardian"

/**
 * The sheet, at the moment it is created.
 *
 * The line the whole ceremony rests on is `keyLede`: *"It was never sent to us,
 * we hold no copy, and we cannot issue it again — because if we could, we could
 * open the heirs' boxes on our own."* Every product says "we can't recover this
 * for you" as an apology. Said that way it is a proof, and it is why this screen
 * can ask someone to keep a piece of paper for a decade without sounding
 * negligent.
 *
 * That sentence stays exactly true now that the device can keep a copy. What
 * the passkey holds is a copy *on the guardian's own hardware*, openable only
 * by them; we still have nothing, and a wiped device still leaves the paper as
 * the only way back. The offer to keep one comes after acceptance, on the next
 * screen — before it, there is no guardianship for the copy to belong to.
 */
export function AcceptSheet({
  labels,
  sheet,
  onNext,
}: {
  labels: Resolved<typeof GUARDIAN>
  sheet: GuardianKeySheet
  onNext: () => void
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="bg-secondary h-1 w-11 shrink-0 rounded-full"
        />
        <span className="text-olive-700 text-[13.5px] font-semibold">
          {labels.createdNow}
        </span>
      </div>

      <h1 className="font-heading mt-6 mb-4 text-[28px] leading-[1.15] font-black md:text-[34px]">
        {labels.keyTitleOne}{" "}
        <span className="text-secondary">{labels.keyTitleTwo}</span>
      </h1>

      <p className="mb-7 max-w-[62ch] text-[15.5px] leading-[1.72] opacity-80">
        {labels.keyLede}
      </p>

      <KeySheet code={sheet.code} />

      <button
        type="button"
        onClick={onNext}
        className="font-heading mt-6 inline-flex items-center gap-2.5 self-start text-[16px] font-extrabold"
      >
        {labels.confirmTitle}
        <ArrowRightIcon
          className="nudge size-5 rtl:-scale-x-100"
          strokeWidth={2.75}
          aria-hidden
        />
      </button>
    </div>
  )
}
