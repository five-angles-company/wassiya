"use client"

import { useState } from "react"
import type { GuardianKeySheet } from "@workspace/crypto/guardianKey"
import { FingerprintIcon, InfoIcon, ShieldCheckIcon } from "lucide-react"

import { Button } from "@/components/button"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import {
  deviceKeySupported,
  saveDeviceKey,
  type SaveOutcome,
} from "@/features/guardian/lib/device-key"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

/**
 * The offer to keep a copy on this device.
 *
 * ## It is an offer, and the wording is careful
 *
 * The guardian has just been told, in the strongest terms the product uses,
 * that we hold no copy and cannot reissue their key. Offering to store one a
 * screen later would read as a contradiction if the copy were ours. It is not:
 * it is sealed to this device's own authenticator and openable only by whoever
 * can pass its fingerprint or PIN. The copy says so out loud rather than
 * assuming the reader will infer it.
 *
 * ## Declining costs nothing, and the copy says that too
 *
 * The printed sheet remains the durable one either way. A guardian who says no,
 * or whose browser has no PRF, is exactly where every guardian is today: they
 * type the code when they need it. So the failure states are all phrased as
 * facts rather than as problems — an unsupported browser is not the reader's
 * mistake and should not be reported like one.
 */
export function KeepOnDevice({ sheet }: { sheet: GuardianKeySheet }) {
  const labels = t(GUARDIAN_DUTIES, useLocale())
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<SaveOutcome | null>(null)

  if (!deviceKeySupported()) return null

  async function keep() {
    setBusy(true)
    setOutcome(
      await saveDeviceKey({
        secretKey: sheet.secretKey,
        publicKey: sheet.publicKey,
        version: sheet.version,
        label: labels.deviceKeyLabel,
      })
    )
    setBusy(false)
  }

  if (outcome === "saved") {
    return (
      <p className="text-olive-700 mt-6 flex items-start gap-2.5 text-[14px] leading-[1.7]">
        <ShieldCheckIcon
          className="mt-0.5 size-4 shrink-0"
          strokeWidth={2.4}
          aria-hidden
        />
        {labels.deviceKeySaved}
      </p>
    )
  }

  return (
    <div className="border-border mt-7 border-t pt-6">
      <h3 className="flex items-center gap-2.5 text-[15.5px] font-semibold">
        <FingerprintIcon className="size-[18px]" strokeWidth={2.3} aria-hidden />
        {labels.deviceKeyOfferTitle}
      </h3>
      <p className="text-muted-foreground mt-2 max-w-[56ch] text-[14px] leading-[1.7]">
        {labels.deviceKeyOfferBody}
      </p>

      <Button
        variant="secondary"
        className="mt-5"
        onClick={() => void keep()}
        disabled={busy}
      >
        {busy ? labels.deviceKeySaving : labels.deviceKeyOfferAction}
      </Button>

      {outcome !== null && (
        <p className="text-muted-foreground mt-4 flex items-start gap-2.5 text-[13.5px] leading-[1.7]">
          <InfoIcon
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={2.3}
            aria-hidden
          />
          {outcome === "unsupported"
            ? labels.deviceKeyUnsupported
            : labels.deviceKeyDeclined}
        </p>
      )}
    </div>
  )
}
