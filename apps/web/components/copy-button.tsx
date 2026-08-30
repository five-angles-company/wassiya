"use client"

import { useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * Copy one string to the clipboard.
 *
 * Every machine string in this app is meant to leave it — a key half read down
 * a phone, a provider URL opened on a laptop, a claim reference quoted to
 * support — and every one of them is unforgiving of a transcription slip.
 *
 * `navigator.clipboard` is `undefined` on an insecure origin and can reject
 * when the document is not focused. Both are handled the same way: the button
 * simply does not report success, so a reader who sees no confirmation selects
 * the text by hand rather than pasting nothing and never finding out.
 */
export function CopyButton({
  value,
  label,
  className,
}: {
  value: string
  /** Overrides the default "Copy" — use it when the row is ambiguous. */
  label?: string
  className?: string
}) {
  const labels = t(COMMON, useLocale())
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard
          ?.writeText(value)
          .then(() => setCopied(true))
          .catch(() => setCopied(false))
      }}
      className={
        className ??
        "border-border hover:bg-muted inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13.5px] font-semibold transition-colors"
      }
    >
      {copied ? (
        <CheckIcon className="size-4" strokeWidth={2.6} aria-hidden />
      ) : (
        <CopyIcon className="size-4" strokeWidth={2.2} aria-hidden />
      )}
      {copied ? labels.copied : (label ?? labels.copy)}
    </button>
  )
}
