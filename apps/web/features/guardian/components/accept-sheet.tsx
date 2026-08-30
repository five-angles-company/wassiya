"use client"

import type { GuardianKeySheet } from "@workspace/crypto/guardianKey"
import { ArrowRightIcon, PrinterIcon } from "lucide-react"

import { CopyButton } from "@/components/copy-button"
import type { Resolved } from "@/lib/i18n/locale"
import type { GUARDIAN } from "@/features/guardian/strings/guardian"

/**
 * The sheet.
 *
 * Rendered as chips rather than one long string because a person reading it off
 * a screen to copy onto paper loses their place in a 56-character run.
 *
 * The line the whole ceremony rests on is `keyLede`: *"It was never sent to us,
 * we hold no copy, and we cannot issue it again — because if we could, we could
 * open the heirs' boxes on our own."* Every product says "we can't recover this
 * for you" as an apology. Said that way it is a proof, and it is why this screen
 * can ask someone to keep a piece of paper for a decade without sounding
 * negligent.
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
  const groups = sheet.code.split("-")

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

      <div className="max-w-[640px]">
        {/* On the page ground rather than the card tone: this is the one block
            on screen meant to end up on paper, and a print takes the ground
            with it. */}
        <div className="rounded-card border-border bg-background mb-4 border-2 px-6 py-7">
          <div className="font-heading mb-4 text-[16px] font-extrabold">
            {labels.sheetTitle}
          </div>

          <div dir="ltr" className="mb-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {groups.map((group, index) => (
              <span
                key={`${group}-${index}`}
                className="bg-card rounded-[12px] py-2.5 text-center font-mono text-[14px] font-semibold"
              >
                {group}
              </span>
            ))}
          </div>

          <p className="text-[13px] leading-[1.65] opacity-70">
            {labels.sheetNote}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-secondary text-secondary-foreground hover:bg-olive-600 inline-flex h-[54px] flex-1 items-center justify-center gap-2.5 rounded-full text-[15px] font-bold transition-colors"
          >
            <PrinterIcon className="size-5" strokeWidth={2.4} aria-hidden />
            {labels.print}
          </button>
          <CopyButton
            value={sheet.code}
            label={labels.copy}
            className="border-border hover:bg-muted inline-flex h-[54px] items-center justify-center gap-2 rounded-full border-[1.5px] px-7 text-[15px] font-bold transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={onNext}
          className="font-heading mt-6 inline-flex items-center gap-2.5 text-[16px] font-extrabold"
        >
          {labels.confirmTitle}
          <ArrowRightIcon
            className="size-5 rtl:-scale-x-100"
            strokeWidth={2.75}
            aria-hidden
          />
        </button>
      </div>
    </div>
  )
}
