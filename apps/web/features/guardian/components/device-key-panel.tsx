"use client"

import { useState, useSyncExternalStore } from "react"
import { encodeGuardianKey } from "@workspace/crypto/guardianKey"
import { guardianPublicKey } from "@workspace/crypto/guardian"
import { equalBytes } from "@workspace/crypto/bytes"
import { CheckIcon, TriangleAlertIcon } from "lucide-react"

import { Button } from "@/components/button"
import { DocSection } from "@/components/doc/section"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { KeySheet } from "@/features/guardian/components/key-sheet"
import {
  deviceKeyHeldServerSnapshot,
  deviceKeyHeldSnapshot,
  forgetDeviceKey,
  loadDeviceKey,
  subscribeDeviceKey,
} from "@/features/guardian/lib/device-key"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

type Shown = { code: string; matches: boolean }

/**
 * The key page's answer when this device is the one that accepted: see whether
 * the key here is still the registered one, and get the sheet back to print
 * again — both for a fingerprint rather than fifty-six typed characters.
 *
 * **The match is computed, not asserted.** The stored record carries the public
 * key it was saved with, but that is our own note and proves nothing, so the
 * check derives the public key from the secret that actually came out of the
 * authenticator and compares it against what the server has published. A stored
 * copy that no longer matches means the owner re-appointed this guardian, and
 * the reader needs to know before the ceremony rather than during it.
 *
 * Nothing renders until the reader asks: a key page opened on a laptop in an
 * office must not paint a printable secret onto the screen because someone
 * clicked a nav item — the unlock is the consent.
 *
 * Forgetting does not need the authenticator. Someone on a borrowed machine must
 * be able to remove the copy without first proving they can open it, and the
 * paper is unaffected.
 */
export function DeviceKeyPanel({
  published,
}: {
  /** Every X25519 public key the server has for this guardian's vaults. */
  published: readonly Uint8Array[]
}) {
  const labels = t(GUARDIAN_DUTIES, useLocale())
  const [busy, setBusy] = useState(false)
  const [shown, setShown] = useState<Shown | null>(null)
  const [failed, setFailed] = useState(false)

  // `localStorage` is an external store, so it is read through
  // `useSyncExternalStore` rather than an effect that calls `setState`. An
  // effect would render "absent" and then correct itself, and a panel that
  // flickers into existence on a page about key custody reads as a fault. The
  // server snapshot is `false`, which is simply true: the server knows nothing
  // about this device.
  const held = useSyncExternalStore(
    subscribeDeviceKey,
    deviceKeyHeldSnapshot,
    deviceKeyHeldServerSnapshot
  )

  if (!held) return null

  async function reveal() {
    setBusy(true)
    setFailed(false)
    const loaded = await loadDeviceKey()
    if (loaded === null) {
      setFailed(true)
      setBusy(false)
      return
    }
    try {
      const derived = guardianPublicKey(loaded.secretKey)
      setShown({
        code: encodeGuardianKey(loaded.secretKey, loaded.version),
        matches: published.some((key) => equalBytes(derived, key)),
      })
    } finally {
      // The code string stays in state — it is what the reader asked for. The
      // raw secret does not need to.
      loaded.secretKey.fill(0)
      setBusy(false)
    }
  }

  return (
    <DocSection title={labels.deviceHeldTitle}>
      <p className="text-muted-foreground max-w-[66ch] text-[14.5px] leading-[1.72]">
        {labels.deviceHeldBody}
      </p>

      {shown === null ? (
        <>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => void reveal()}
            disabled={busy}
          >
            {busy ? labels.deviceUnlocking : labels.deviceShowSheet}
          </Button>
          {failed && (
            <p className="text-tone-attention mt-4 text-[14px] leading-[1.7]">
              {labels.deviceUnlockFailed}
            </p>
          )}
        </>
      ) : (
        <div className="mt-6">
          <p className="mb-5 flex items-start gap-2.5 text-[14px] leading-[1.7] font-semibold">
            {shown.matches ? (
              <CheckIcon
                className="mt-0.5 size-4 shrink-0"
                strokeWidth={2.6}
                aria-hidden
              />
            ) : (
              <TriangleAlertIcon
                className="mt-0.5 size-4 shrink-0"
                strokeWidth={2.4}
                aria-hidden
              />
            )}
            {shown.matches ? labels.deviceMatchOk : labels.deviceMatchBad}
          </p>

          <KeySheet code={shown.code} />

          <Button
            variant="outline"
            size="sm"
            className="mt-5"
            onClick={() => setShown(null)}
          >
            {labels.deviceHide}
          </Button>
        </div>
      )}

      <div className="border-border mt-7 border-t pt-5">
        <button
          type="button"
          onClick={() => {
            forgetDeviceKey()
            setShown(null)
          }}
          className="text-muted-foreground hover:text-foreground text-[13.5px] font-semibold underline underline-offset-4"
        >
          {labels.deviceForget}
        </button>
        <p className="text-muted-foreground mt-2 text-[12.5px] leading-[1.65]">
          {labels.deviceForgetNote}
        </p>
      </div>
    </DocSection>
  )
}
