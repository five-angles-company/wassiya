"use client"

import { useEffect, useState } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { bytesToHex } from "@workspace/crypto/bytes"
import { openFromGuardian } from "@workspace/crypto/guardian"
import { decodeGuardianKey } from "@workspace/crypto/guardianKey"
import { useMutation } from "convex/react"
import { KeyRoundIcon, TriangleAlertIcon } from "lucide-react"

import { Button } from "@/components/button"
import { CopyButton } from "@/components/copy-button"
import { TextInput } from "@/components/text-input"
import { Panel } from "@/components/panel"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

/**
 * The guardian hands over their half of K_h.
 *
 * **The unwrap happens here, in the browser, and nowhere else.** The server
 * stores `S_guardian_h` sealed to the guardian's X25519 public key and has never
 * been able to open it: `release.guardianShareForClaim` returns the sealed blob,
 * and `openFromGuardian` opens it with the secret typed off the printed sheet.
 * Both exist only in this tab.
 *
 * The plaintext is **shown rather than sent**. The whole construction is worth
 * nothing if this service can put both halves in one place, so the app does not
 * message the heir, does not email the share, and does not store it. The warning
 * under it is not boilerplate — whoever holds both halves opens the box.
 *
 * `v.bytes()` arrives as an `ArrayBuffer` and `@workspace/crypto` asserts on
 * `Uint8Array`; the wrap below is explicit because a missed one fails inside
 * `open()` with a tag error indistinguishable from a wrong key.
 */
export function HandoverPanel({
  claimId,
  subjectName,
}: {
  claimId: string
  subjectName: string
}) {
  const labels = t(GUARDIAN_DUTIES, useLocale())
  const fetchShare = useMutation(api.release.guardianShareForClaim)
  const [typed, setTyped] = useState("")
  const [busy, setBusy] = useState(false)
  const [share, setShare] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // The share is a live capability for as long as it is on screen. Nothing can
  // scrub the string React is rendering, but the state is dropped the moment the
  // guardian navigates away rather than being left for the next render tree.
  useEffect(() => () => setShare(null), [])

  async function unwrap() {
    setBusy(true)
    setError(null)
    let secretKey: Uint8Array | undefined
    let opened: Uint8Array | undefined
    try {
      // Decoded first: a mistyped sheet should fail before a mutation runs and
      // writes an audit line for a handover that did not happen.
      secretKey = decodeGuardianKey(typed).secretKey
    } catch {
      setError(labels.handoverKeyBad)
      setBusy(false)
      return
    }
    try {
      const { guardianShareSealed } = await fetchShare({
        claimId: claimId as Id<"claims">,
      })
      opened = openFromGuardian(new Uint8Array(guardianShareSealed), secretKey)
      setShare(bytesToHex(opened))
    } catch (cause) {
      // A sheet from a different guardianship and a tampered blob both fail the
      // same Poly1305 tag. The commoner cause by far is the wrong sheet.
      setError(
        cause instanceof Error && /tag|decrypt|auth|length/i.test(cause.message)
          ? labels.handoverKeyBad
          : labels.handoverFailed
      )
    } finally {
      secretKey?.fill(0)
      opened?.fill(0)
      setBusy(false)
    }
  }

  if (share !== null) {
    return (
      <Panel accent="secondary" icon={KeyRoundIcon} title={labels.handoverResultTitle}>
        <p className="text-muted-foreground mb-5 max-w-[62ch] text-[14.5px] leading-[1.72]">
          {labels.handoverResultBody}
        </p>

        <p
          dir="ltr"
          className="rounded-card bg-background border-border border px-5 py-4 font-mono text-[14px] leading-[1.9] font-semibold break-all"
        >
          {share}
        </p>

        <div className="mt-4">
          <CopyButton
            value={share}
            className="border-border hover:bg-sand-100 inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border px-4 text-[13.5px] font-semibold transition-colors"
          />
        </div>

        <p className="text-terracotta-800 mt-5 flex items-start gap-2.5 text-[13.5px] leading-[1.7]">
          <TriangleAlertIcon
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={2.4}
            aria-hidden
          />
          {labels.handoverWarn}
        </p>
      </Panel>
    )
  }

  return (
    <Panel
      accent="primary"
      icon={KeyRoundIcon}
      title={labels.dutyHandoverTitle.replace("{name}", subjectName)}
    >
      <p className="text-muted-foreground max-w-[62ch] text-[14.5px] leading-[1.72]">
        {labels.handoverBody}
      </p>

      <label className="mt-6 mb-2.5 block text-[14px] font-semibold">
        {labels.handoverKeyLabel}
      </label>
      <TextInput
        mono
        value={typed}
        onChange={(event) => {
          setTyped(event.target.value)
          if (error !== null) setError(null)
        }}
        placeholder="WSYG1-…"
        invalid={error !== null}
        className="max-w-[560px]"
      />

      {error !== null && (
        <p className="mt-3 max-w-[62ch] text-[14px] leading-[1.65]">{error}</p>
      )}

      <Button
        variant="secondary"
        className="mt-6"
        onClick={() => void unwrap()}
        disabled={busy || typed.trim().length === 0}
      >
        {busy ? labels.handoverBusy : labels.handoverAction}
      </Button>
    </Panel>
  )
}
