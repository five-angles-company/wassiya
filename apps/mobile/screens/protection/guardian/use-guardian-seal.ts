/**
 * Sealing S_guardian to an accepted guardian — the step that finally makes the
 * 2-of-3 a 2-of-3.
 *
 * ## What is broken until this runs
 *
 * Section ٢ generates S_paper and S_guardian, prints the paper half, and stores
 * the guardian half **on the owner's own device**. K_rec = S_paper ⊕ S_guardian,
 * so until S_guardian exists somewhere other than that phone, losing the phone
 * loses the vault — and the printed sheet, which says it recovers the vault,
 * does not. That is the most consequential gap in the product, and this closes
 * it.
 *
 * ## The ordering, which is not interchangeable
 *
 *  1. Read S_guardian from the keystore (biometric).
 *  2. Seal it to the guardian's published X25519 key. The sealed box binds both
 *     public keys into its AAD, so it cannot be replayed against a different
 *     guardian even by someone able to rewrite the row.
 *  3. `keyring.attachGuardian` — a `patch`, deliberately, so this cannot blank
 *     `mkWrappedByRecovery` or bump `paperVersion`. A sheet already sitting in
 *     someone's safe stays valid.
 *  4. The local copy of S_guardian **stays**. Deleting it would look tidy and
 *     would make the device unable to reissue the recovery sheet
 *     (`rotatePaperShare` needs S_guardian to re-derive the wrapper), turning a
 *     lost sheet into a lost vault. It is not a second copy of a secret so much
 *     as the same share the guardian now also holds, and the owner's device is
 *     already the place MK itself lives.
 */
import { useCallback, useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { sealToGuardian } from "@workspace/crypto/guardian"

import { ensureWebCrypto } from "@/lib/crypto-polyfill"
import { readGuardianShare, VaultKeyLostError } from "@/lib/secure-vault"

export type SealState = "idle" | "sealing" | "done" | "keyLost" | "failed"

export function useGuardianSeal(prompt: string): {
  state: SealState
  seal: (guardianId: Id<"guardians">, publicKey: ArrayBuffer) => Promise<void>
} {
  const attach = useMutation(api.keyring.attachGuardian)
  const [state, setState] = useState<SealState>("idle")

  const seal = useCallback(
    async (guardianId: Id<"guardians">, publicKey: ArrayBuffer) => {
      setState("sealing")
      try {
        ensureWebCrypto()
        const share = await readGuardianShare(prompt)
        try {
          const sealed = sealToGuardian(share, new Uint8Array(publicKey))
          await attach({
            guardianId,
            guardianShareSealed: new Uint8Array(sealed).buffer,
          })
          setState("done")
        } finally {
          // The keystore copy stays; this is only the working copy in memory.
          share.fill(0)
        }
      } catch (error) {
        // A lost keystore key here is terminal for *this* device's ability to
        // enrol a guardian, and the recovery ceremony is the only way back.
        setState(error instanceof VaultKeyLostError ? "keyLost" : "failed")
      }
    },
    [attach, prompt]
  )

  return { state, seal }
}
