"use client"

import { useEffect, useState } from "react"
import { openMessage } from "@workspace/crypto/message"
import { QuoteIcon } from "lucide-react"

import { IconDisc } from "@/components/icon-disc"
import { useLocale } from "@/components/locale-provider"
import { Placeholder } from "@/components/placeholder"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { HEIR_BOX } from "@/features/box/strings/heir-box"

/**
 * The personal message, decrypted in this tab with the key the bundle carried.
 * The plaintext lives only in this component's state.
 */
export function HeirMessage({ url, messageKey }: { url: string; messageKey: Uint8Array }) {
  const locale = useLocale()
  const labels = t(HEIR_BOX, locale)
  const common = t(COMMON, locale)
  const [text, setText] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error(String(response.status))
        const opened = openMessage(new Uint8Array(await response.arrayBuffer()), messageKey)
        if (!cancelled) setText(opened)
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [url, messageKey])

  // A letter, not a status: generous leading, the owner's own line breaks.
  return (
    <section className="rise-in bg-card border-border rounded-panel border p-7 shadow-[var(--shadow-raised)] md:p-9">
      <div className="flex items-center gap-4">
        <IconDisc icon={QuoteIcon} tone="settled" />
        <h2 className="font-heading text-[21px] leading-snug font-extrabold">{labels.messageTitle}</h2>
      </div>
      <div className="mt-6">
        {failed ? (
          <p className="text-tone-attention text-[15px] leading-[1.75] font-semibold">{labels.messageFailed}</p>
        ) : text === null ? (
          <Placeholder label={common.loading} className="h-24" />
        ) : (
          <p className="max-w-[62ch] text-[17px] leading-[2] whitespace-pre-wrap">{text}</p>
        )}
      </div>
    </section>
  )
}
