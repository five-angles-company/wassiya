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
import { AcceptConfirm } from "@/features/guardian/components/accept-confirm"
import { AcceptDone } from "@/features/guardian/components/accept-done"
import { AcceptReview } from "@/features/guardian/components/accept-review"
import { AcceptSheet } from "@/features/guardian/components/accept-sheet"
import { GUARDIAN } from "@/features/guardian/strings/guardian"

type Phase =
  | { step: "review" }
  | { step: "sheet"; sheet: GuardianKeySheet }
  | { step: "confirm"; sheet: GuardianKeySheet; error?: "mismatch" | "failed" }
  | { step: "done"; sheet: GuardianKeySheet }

/**
 * `/guardian/accept` — the invitation, the key, and the one confirmation.
 *
 * ## The ordering is load-bearing: mint → display → confirm → accept
 *
 * `guardians.accept` publishes the guardian's X25519 public key and spends the
 * invitation. If it ran before the guardian had seen and typed back their code,
 * a public key would exist whose private half nobody holds — and nothing would
 * notice: the owner's protection score would turn green, every heir bundle
 * would seal to that key, and the failure would surface years later at the one
 * ceremony that cannot be retried.
 *
 * So the key is minted here in the browser, shown, and only accepted once
 * `guardianKeyMatches` confirms the guardian can reproduce it. The invitation
 * survives an abandoned attempt; a key nobody holds would not survive anything.
 *
 * ## Nothing leaves this component but a public key
 *
 * `mintGuardianKeySheet` runs client-side. The secret exists as the printed
 * code and in this page's memory; `guardians.accept` receives the public half
 * and nothing else.
 */
export function AcceptFlow({
  token,
  ownerName,
}: {
  token: string
  ownerName: string
}) {
  const labels = t(GUARDIAN, useLocale())
  const accept = useMutation(api.guardians.accept)
  const [phase, setPhase] = useState<Phase>({ step: "review" })
  const [typed, setTyped] = useState("")
  const [busy, setBusy] = useState(false)

  async function finish(sheet: GuardianKeySheet) {
    if (!guardianKeyMatches(typed, sheet.publicKey)) {
      setPhase({ step: "confirm", sheet, error: "mismatch" })
      return
    }
    setBusy(true)
    try {
      await accept({
        inviteToken: token,
        // `@workspace/crypto` builds its outputs with `subarray`, so the
        // underlying buffer can be larger than the view — passing it raw would
        // ship trailing bytes and fail the 32-byte check on the server.
        x25519PublicKey: new Uint8Array(sheet.publicKey).buffer,
      })
      setPhase({ step: "done", sheet })
    } catch {
      setPhase({ step: "confirm", sheet, error: "failed" })
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
      return <AcceptDone labels={labels} sheet={phase.sheet} />
  }
}
