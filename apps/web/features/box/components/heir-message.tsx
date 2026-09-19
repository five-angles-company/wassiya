"use client"

import { useEffect, useState } from "react"
import { openMessage } from "@workspace/crypto/message"

import { DocSection } from "@/components/doc/section"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { HEIR_BOX } from "@/features/box/strings/heir-box"

/**
 * The personal message, decrypted in this tab with the key the bundle carried.
 * The plaintext lives only in this component's state.
 */
export function HeirMessage({ url, messageKey }: { url: string; messageKey: Uint8Array }) {
  const labels = t(HEIR_BOX, useLocale())
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

  return (
    <DocSection title={labels.messageTitle}>
      {failed ? (
        <p className="text-tone-attention text-[14px] leading-[1.7]">{labels.messageFailed}</p>
      ) : text === null ? (
        <div className="bg-muted h-16 animate-pulse rounded" aria-hidden />
      ) : (
        <p className="max-w-[66ch] text-[16px] leading-[1.9] whitespace-pre-wrap">{text}</p>
      )}
    </DocSection>
  )
}
