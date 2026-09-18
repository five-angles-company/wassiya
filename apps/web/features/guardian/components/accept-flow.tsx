"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import {
  guardianKeyMatches,
  mintGuardianKeySheet,
  type GuardianKeySheet,
} from "@workspace/crypto/guardianKey"
import { useMutation } from "convex/react"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import {
  forgetDeviceKey,
  saveDeviceKey,
  type SaveOutcome,
} from "@/features/guardian/lib/device-key"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"
import { AcceptConfirm } from "@/features/guardian/components/accept-confirm"
import { AcceptDone } from "@/features/guardian/components/accept-done"
import { AcceptReview } from "@/features/guardian/components/accept-review"
import { AcceptSeal } from "@/features/guardian/components/accept-seal"
import { AcceptSheet } from "@/features/guardian/components/accept-sheet"
import { GUARDIAN } from "@/features/guardian/strings/guardian"

type Phase =
  | { step: "review" }
  | { step: "sheet"; sheet: GuardianKeySheet }
  | { step: "seal"; sheet: GuardianKeySheet; outcome?: SaveOutcome }
  | { step: "confirm"; sheet: GuardianKeySheet; error?: "mismatch" | "failed" }
  | { step: "done"; sheet: GuardianKeySheet; keptOnDevice: boolean }

/**
 * `/guardian/accept` — the invitation, the key, and the one confirmation.
 *
 * **The ordering is load-bearing: mint → display → confirm → accept.**
 * `guardians.accept` publishes the guardian's X25519 public key and spends the
 * invitation. Run before the guardian has seen and typed back their code, it
 * would leave a public key whose private half nobody holds — and nothing would
 * notice: the owner's protection score would turn green, every heir bundle would
 * seal to that key, and the failure would surface years later at the one
 * ceremony that cannot be retried. The invitation survives an abandoned attempt;
 * a key nobody holds would not survive anything.
 *
 * `mintGuardianKeySheet` runs client-side. The secret exists as the printed code
 * and in this page's memory; `guardians.accept` receives the public half only.
 *
 * ## 🚨 There are two proofs now, and the fingerprint is one of them
 *
 * What the confirm step is actually for is **evidence that a working copy of the
 * secret exists outside this tab's memory** — because after `accept` the public
 * key is published and every heir bundle seals to it. Typing the code back
 * proves the paper. It is not the only thing that can prove it: a key sealed to
 * this device's authenticator, written and openable only after user
 * verification, is the same evidence about a different copy.
 *
 * So `confirm` is now a road rather than a stage, and the common case skips it:
 * four screens become three, and the hardest interaction in the flow — transcribe
 * fifty-six characters from a sheet that is deliberately not on screen — stops
 * being mandatory.
 *
 * ## ⚠️ The seal must happen BEFORE `accept`, and is rolled back if `accept` fails
 *
 * This inverts an order two docstrings used to defend: the offer lived on
 * `accept-done` because *"a device holding a key for an invitation that was
 * never spent would be a small lie the reader could not see."* That reason is
 * still right, and it is the reason for `forgetDeviceKey()` on the failure path
 * rather than a reason to keep typing.
 *
 * The inversion is forced, not stylistic: a fingerprint **after** the seal
 * proves a copy is retrievable, and a fingerprint **before** it proves nothing
 * at all — there would be nothing stored to retrieve, and the secret would still
 * be sitting in this tab's memory where it has been since `mintGuardianKeySheet`.
 * Evidence of a durable copy cannot be gathered before the copy is made.
 *
 * ⚠️ **`saveDeviceKey` returning `"saved"` is the proof, and it is not re-read.**
 * It has already created the credential, evaluated the PRF under user
 * verification and written the ciphertext. Loading it straight back would cost a
 * third authenticator prompt in a row to catch a credential that disappears
 * *between two adjacent calls* — which a re-read would not catch either, since
 * the disappearance we actually fear happens months later.
 *
 * ⚠️ **The paper is still printed and still the durable copy.** The sheet screen
 * shows the code before either road, and `deviceKeyOfferBody` says in as many
 * words that a lost or wiped device leaves the paper as the only way back.
 */
export function AcceptFlow({
  token,
  ownerName,
}: {
  token: string
  ownerName: string
}) {
  const locale = useLocale()
  const labels = t(GUARDIAN, locale)
  const duties = t(GUARDIAN_DUTIES, locale)
  const accept = useMutation(api.guardians.accept)
  const [phase, setPhase] = useState<Phase>({ step: "review" })
  const [typed, setTyped] = useState("")
  const [busy, setBusy] = useState(false)

  /**
   * Spend the invitation and publish the public half.
   *
   * Shared by both proofs, so there is one place that talks to the server and
   * one definition of what "accepted" means.
   */
  async function publish(sheet: GuardianKeySheet) {
    await accept({
      inviteToken: token,
      // `@workspace/crypto` builds its outputs with `subarray`, so the
      // underlying buffer can be larger than the view — passing it raw would
      // ship trailing bytes and fail the 32-byte check on the server.
      x25519PublicKey: new Uint8Array(sheet.publicKey).buffer,
    })
  }

  /** Proof by transcription: the guardian produces the code off the paper. */
  async function finish(sheet: GuardianKeySheet) {
    if (!guardianKeyMatches(typed, sheet.publicKey)) {
      setPhase({ step: "confirm", sheet, error: "mismatch" })
      return
    }
    setBusy(true)
    try {
      await publish(sheet)
      setPhase({ step: "done", sheet, keptOnDevice: false })
    } catch {
      setPhase({ step: "confirm", sheet, error: "failed" })
    } finally {
      setBusy(false)
    }
  }

  /**
   * Proof by custody: the secret is sealed to this device's authenticator, and
   * that it opened at all is the evidence.
   *
   * An unsupported browser or a dismissed prompt are not failures — they are the
   * reader choosing, or being handed, the other road. Both stay on the sheet
   * screen with the outcome shown, and the paper path is right there.
   */
  async function keepAndAccept(sheet: GuardianKeySheet) {
    setBusy(true)
    try {
      const outcome = await saveDeviceKey({
        secretKey: sheet.secretKey,
        publicKey: sheet.publicKey,
        version: sheet.version,
        label: duties.deviceKeyLabel,
      })
      if (outcome !== "saved") {
        setPhase({ step: "seal", sheet, outcome })
        return
      }
      try {
        await publish(sheet)
        setPhase({ step: "done", sheet, keptOnDevice: true })
      } catch {
        // 🚨 The rollback the old ordering was protecting. The invitation is
        // unspent, so this device must not be left holding a key for a
        // guardianship that does not exist.
        forgetDeviceKey()
        setPhase({ step: "confirm", sheet, error: "failed" })
      }
    } finally {
      setBusy(false)
    }
  }

  switch (phase.step) {
    case "review":
      return (
        <AcceptReview
          labels={labels}
          ownerName={ownerName}
          onAccept={() =>
            setPhase({ step: "sheet", sheet: mintGuardianKeySheet() })
          }
        />
      )
    case "sheet":
      return (
        <AcceptSheet
          labels={labels}
          sheet={phase.sheet}
          busy={busy}
          onNext={() => setPhase({ step: "seal", sheet: phase.sheet })}
        />
      )
    case "seal":
      return (
        <AcceptSeal
          labels={labels}
          busy={busy}
          outcome={phase.outcome}
          onKeepOnDevice={() => void keepAndAccept(phase.sheet)}
          onNext={() => setPhase({ step: "confirm", sheet: phase.sheet })}
        />
      )
    case "confirm":
      return (
        <AcceptConfirm
          labels={labels}
          typed={typed}
          busy={busy}
          error={phase.error}
          onType={setTyped}
          onConfirm={() => void finish(phase.sheet)}
        />
      )
    case "done":
      return (
        <AcceptDone
          labels={labels}
          sheet={phase.sheet}
          keptOnDevice={phase.keptOnDevice}
        />
      )
  }
}
