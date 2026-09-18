"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { bytesToHex } from "@workspace/crypto/bytes"
import { openFromGuardian } from "@workspace/crypto/guardian"
import { decodeGuardianKey } from "@workspace/crypto/guardianKey"
import { useMutation } from "convex/react"
import { FingerprintIcon, TriangleAlertIcon } from "lucide-react"

import { Button } from "@/components/button"
import { CopyButton } from "@/components/copy-button"
import { TextInput } from "@/components/text-input"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import {
  deviceKeyHeldServerSnapshot,
  deviceKeyHeldSnapshot,
  loadDeviceKey,
  subscribeDeviceKey,
} from "@/features/guardian/lib/device-key"
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
 *
 * ## 🚨 Two ways in, and the fingerprint is offered first
 *
 * This panel took a **typed** sheet and nothing else, on a device that may hold
 * the very same secret sealed to its own authenticator. So the one piece of
 * automation in the guardian's world — `KeepOnDevice`, minted the day they
 * accepted — could reprint the paper and could not do the paper's job. A
 * guardian transcribed fifty-six characters at a bereavement ceremony while
 * their thumb rested on a sensor that already held the answer.
 *
 * ⚠️ **This adds no capability to anybody.** The secret is the same secret; the
 * only change is where this tab reads it from. What gates a handover is the
 * claim being `released` — an identity-verified heir, a certificate name match,
 * a guardian confirmation and an elapsed veto window — never the act of typing.
 * Transcription was a tax on the guardian, not a control on the ceremony.
 *
 * ⚠️ **And it fails closed, which `AGENTS.md` requires of everything built on
 * the device copy**: *"no passkey, a wiped device, a browser with no PRF all
 * land the reader back on typing the sheet."* The field below is always
 * rendered and never disabled. A guardian whose authenticator refuses is
 * exactly where every guardian was before this existed, one paragraph lower
 * down the page.
 *
 * ⚠️ **A device copy that opens but does not match is worth its own message.**
 * It means the owner re-appointed this guardian, and `deviceMatchBad` says so —
 * `handoverKeyBad` ("check the characters") would send somebody hunting a typo
 * in a code they did not type.
 */
export function HandoverPanel({ claimId }: { claimId: string }) {
  const labels = t(GUARDIAN_DUTIES, useLocale())
  const fetchShare = useMutation(api.release.guardianShareForClaim)
  const [typed, setTyped] = useState("")
  // Which road is running, so the right button says so and the other stays
  // usable. A boolean could not tell the two apart.
  const [busy, setBusy] = useState<"device" | "typed" | null>(null)
  const [share, setShare] = useState<string | null>(null)
  // Who to hand it to. Held beside the share and dropped with it — the two are
  // only useful together, and neither should outlive the screen.
  const [heir, setHeir] = useState<{ name: string; contact: string } | null>(
    null
  )
  // The failure is rendered under the road that produced it. One error slot
  // with no provenance would print "check the characters" above an untouched
  // field when the authenticator was what failed.
  const [error, setError] = useState<{
    from: "device" | "typed"
    text: string
  } | null>(null)

  // Whether this device holds a sealed copy. `localStorage` is an external
  // store, so it is read the way `DeviceKeyPanel` reads it — an effect would
  // render the typed-only layout and then grow a button, and a ceremony screen
  // that rearranges itself under the reader is the wrong place for that.
  const held = useSyncExternalStore(
    subscribeDeviceKey,
    deviceKeyHeldSnapshot,
    deviceKeyHeldServerSnapshot
  )

  // The share is a live capability for as long as it is on screen. Nothing can
  // scrub the string React is rendering, but the state is dropped the moment the
  // guardian navigates away rather than being left for the next render tree.
  useEffect(() => {
    return () => {
      setShare(null)
      setHeir(null)
    }
  }, [])

  /**
   * The ceremony itself, once a secret is in hand — identical whichever road
   * supplied it, which is the point of taking it as an argument.
   *
   * It owns the zeroing: both callers hand over a key they have stopped
   * tracking, so there is exactly one place responsible for wiping it and no
   * path that can forget.
   */
  async function handOver(secretKey: Uint8Array, from: "device" | "typed") {
    let opened: Uint8Array | undefined
    try {
      const { guardianShareSealed, heirName, heirContact } = await fetchShare({
        claimId: claimId as Id<"claims">,
      })
      opened = openFromGuardian(new Uint8Array(guardianShareSealed), secretKey)
      setShare(bytesToHex(opened))
      setHeir({ name: heirName, contact: heirContact })
    } catch (cause) {
      // A sheet from a different guardianship and a tampered blob both fail the
      // same Poly1305 tag. What that means depends on where the key came from:
      // a typed one is nearly always a transcription slip, while a stored one
      // was correct the day it was sealed — so it failing means the registered
      // key changed under it.
      const mismatch =
        cause instanceof Error && /tag|decrypt|auth|length/i.test(cause.message)
      setError({
        from,
        text: mismatch
          ? from === "device"
            ? labels.deviceMatchBad
            : labels.handoverKeyBad
          : labels.handoverFailed,
      })
    } finally {
      secretKey.fill(0)
      opened?.fill(0)
      setBusy(null)
    }
  }

  /** The sealed copy on this device, behind the authenticator's own prompt. */
  async function unwrapFromDevice() {
    setBusy("device")
    setError(null)
    const loaded = await loadDeviceKey()
    if (loaded === null) {
      // Nothing stored, a dismissed prompt, a credential this device no longer
      // has — none of them distinguishable and none of them worth three
      // different sentences. The field below is the answer to all three, and
      // `deviceUnlockFailed` points at it.
      setError({ from: "device", text: labels.deviceUnlockFailed })
      setBusy(null)
      return
    }
    await handOver(loaded.secretKey, "device")
  }

  /** The printed sheet, which has always worked and still does. */
  async function unwrapFromTyped() {
    setBusy("typed")
    setError(null)
    let secretKey: Uint8Array
    try {
      // Decoded first: a mistyped sheet should fail before a mutation runs and
      // writes an audit line for a handover that did not happen.
      secretKey = decodeGuardianKey(typed).secretKey
    } catch {
      setError({ from: "typed", text: labels.handoverKeyBad })
      setBusy(null)
      return
    }
    await handOver(secretKey, "typed")
  }

  if (share !== null) {
    return (
      <div>
        <p className="text-muted-foreground mb-5 max-w-[66ch] text-[14.5px] leading-[1.72]">
          {labels.handoverResultBody}
        </p>

        {/* Who, and how to reach them. The copy above tells the guardian to
            make sure they are speaking to the right person; until this was
            returned they had a name at best and no number at all. */}
        {heir !== null && (
          <div className="rounded-card bg-background border-border mb-5 border px-5 py-4">
            <div className="text-muted-foreground text-[12px] font-semibold">
              {labels.handoverRecipient}
            </div>
            <div className="mt-1 text-[15px] font-semibold">{heir.name}</div>
            <div dir="ltr" className="mt-1 font-mono text-[14px] font-semibold">
              {heir.contact}
            </div>
          </div>
        )}

        <p
          dir="ltr"
          className="rounded-card bg-background border-border border px-5 py-4 font-mono text-[14px] leading-[1.9] font-semibold break-all"
        >
          {share}
        </p>

        <div className="mt-4">
          <CopyButton
            value={share}
            className="border-border hover:bg-muted inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border px-4 text-[13.5px] font-semibold transition-colors"
          />
        </div>

        <p className="text-tone-attention mt-5 flex items-start gap-2.5 text-[13.5px] leading-[1.7]">
          <TriangleAlertIcon
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={2.4}
            aria-hidden
          />
          {labels.handoverWarn}
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-muted-foreground max-w-[66ch] text-[14.5px] leading-[1.72]">
        {labels.handoverBody}
      </p>

      {held && (
        <>
          <Button
            variant="secondary"
            className="mt-6 gap-2.5"
            onClick={() => void unwrapFromDevice()}
            disabled={busy !== null}
          >
            <FingerprintIcon
              className="size-[18px]"
              strokeWidth={2.3}
              aria-hidden
            />
            {busy === "device"
              ? labels.deviceUnlocking
              : labels.handoverDeviceAction}
          </Button>

          {error?.from === "device" && (
            <p className="mt-3 max-w-[66ch] text-[14px] leading-[1.65]">
              {error.text}
            </p>
          )}
        </>
      )}

      {/* Always rendered, never disabled — the sheet is the durable copy and
          every failure above lands here. The hairline appears only when there
          is something above it to divide. */}
      <div className={held ? "border-border mt-7 border-t pt-6" : ""}>
        <label className="mt-6 mb-2.5 block text-[14px] font-semibold">
          {held ? labels.handoverTypeInstead : labels.handoverKeyLabel}
        </label>
        <TextInput
          mono
          value={typed}
          onChange={(event) => {
            setTyped(event.target.value)
            if (error?.from === "typed") setError(null)
          }}
          placeholder="WSYG1-…"
          invalid={error?.from === "typed"}
        />

        {error?.from === "typed" && (
          <p className="mt-3 max-w-[66ch] text-[14px] leading-[1.65]">
            {error.text}
          </p>
        )}

        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => void unwrapFromTyped()}
          disabled={busy !== null || typed.trim().length === 0}
        >
          {busy === "typed" ? labels.handoverBusy : labels.handoverAction}
        </Button>
      </div>
    </div>
  )
}
