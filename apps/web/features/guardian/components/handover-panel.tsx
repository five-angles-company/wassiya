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
 * ## The unwrap happens here, in the browser, and nowhere else
 *
 * The server stores `S_guardian_h` **sealed to the guardian's X25519 public
 * key** and has never been able to open it. `release.guardianShareForClaim`
 * returns that sealed blob; `openFromGuardian` opens it with the secret the
 * guardian just typed off their printed sheet. Both the secret and the opened
 * share exist only in this tab.
 *
 * ## Why the plaintext is shown rather than sent
 *
 * The whole construction is worth nothing if this service can put both halves
 * in one place. So the app does not message the heir, does not email the share,
 * and does not store it: it shows the guardian a string and asks them to hand
 * it over themselves. The warning under it is not boilerplate — whoever holds
 * both halves opens the box.
 *
 * ## Bytes across the wire
 *
 * `v.bytes()` arrives as an `ArrayBuffer` and `@workspace/crypto` asserts on
 * `Uint8Array`. The wrap is explicit below, because a missed one fails inside
 * `open()` with a tag error that is indistinguishable from a wrong key.
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
      <Panel tone="settled" icon={KeyRoundIcon} title={labels.handoverResultTitle}>
        <p className="mb-5 max-w-[62ch] text-[14.5px] leading-[1.72] opacity-90">
          {labels.handoverResultBody}
        </p>

        <p
          dir="ltr"
          className="rounded-card bg-[color:rgba(32,30,29,.22)] px-5 py-4 font-mono text-[14px] leading-[1.9] font-semibold break-all"
        >
          {share}
        </p>

        <div className="mt-4">
          <CopyButton
            value={share}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-[color:currentColor] px-4 text-[13.5px] font-semibold transition-colors"
          />
        </div>

        <p className="mt-5 flex items-start gap-2.5 text-[13.5px] leading-[1.7] opacity-85">
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
      tone="now"
      icon={KeyRoundIcon}
      title={labels.dutyHandoverTitle.replace("{name}", subjectName)}
    >
      <p className="max-w-[62ch] text-[14.5px] leading-[1.72] opacity-80">
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
