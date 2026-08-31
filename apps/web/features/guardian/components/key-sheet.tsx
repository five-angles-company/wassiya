"use client"

import { PrinterIcon } from "lucide-react"

import { Button } from "@/components/button"
import { CopyButton } from "@/components/copy-button"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { KEY_SHEET } from "@/features/guardian/strings/key-sheet"

/**
 * The printed sheet, wherever it is shown.
 *
 * Extracted because there are two places now: once during the accept ceremony,
 * and again on the key page whenever the guardian asks for it back. Two copies
 * of this markup would drift, and the thing that would drift is the layout of a
 * code somebody transcribes onto paper by hand.
 *
 * It carries its own strings for the same reason. Labels living in either
 * feature's dictionary would have to be duplicated into the other, and the two
 * would then be free to disagree.
 *
 * Rendered as chips rather than one long string because a person reading it off
 * a screen loses their place in a fifty-six character run. On the page's ground
 * tone rather than a card: this is the one block in the app meant to end up on
 * paper, and a print takes the ground with it.
 */
export function KeySheet({ code }: { code: string }) {
  const labels = t(KEY_SHEET, useLocale())
  const groups = code.split("-")

  return (
    <div className="max-w-[640px]">
      <div className="rounded-sheet border-border bg-background mb-4 border-2 px-6 py-7 text-[color:var(--foreground)]">
        <div className="font-heading mb-4 text-[16px] font-extrabold">
          {labels.title}
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

        <p className="text-[13px] leading-[1.65] opacity-70">{labels.note}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => window.print()}
        >
          <PrinterIcon className="size-5" strokeWidth={2.4} aria-hidden />
          {labels.print}
        </Button>
        <CopyButton
          value={code}
          label={labels.copy}
          className="border-border hover:bg-sand-100 text-foreground inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border px-6 text-[14.5px] font-semibold transition-colors"
        />
      </div>
    </div>
  )
}
