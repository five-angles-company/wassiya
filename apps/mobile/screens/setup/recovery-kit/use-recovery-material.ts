/**
 * Produces the paper share for 2.4, and persists the only piece of it the
 * server is ever allowed to see.
 *
 * The ordering here is the security-critical part of this session:
 *
 *  1. `S_guardian` is written to the device keystore **before** `keyring.save`.
 *     Reissuing a sheet needs it to re-derive the wrapper, so a crash that left
 *     a server-side keyring row without a local guardian share would produce a
 *     device that can never rotate — unrecoverable, not merely inconvenient.
 *  2. `S_paper` is **never persisted anywhere**. It lives in this hook's return
 *     value for the life of one screen and is dropped once the sheet is out.
 *     That is what makes "we keep no copy" literally true.
 *  3. Only `mkWrappedByRecovery` crosses the wire. It is MK under
 *     K_rec = S_paper ⊕ S_guardian, and the deployment holds neither operand.
 *
 * Re-entering after abandoning an unprinted sheet **rotates** rather than
 * reprints: `S_paper` is gone, so the honest move is a new paper version, which
 * is exactly what `rotatingPaper` is for. The abandoned code stops working.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import { encodePaperCode } from "@workspace/crypto/papercode"
import { rotatePaperShare, splitRecovery } from "@workspace/crypto/recovery"

import { base64UrlEncode } from "@/lib/base64"
import { ensureWebCrypto } from "@/lib/crypto-polyfill"
import {
  patchEnrolment,
  readGuardianShare,
  readMk,
  storeGuardianShare,
  VaultKeyLostError,
} from "@/lib/secure-vault"

/** Versioned QR prefix, so a scanner can tell a blob from a paper code. */
const QR_PREFIX = "WSYB1:"

export type RecoveryMaterial = {
  /** The full code, e.g. "WSY1-K7M2-…" — 14 groups after the prefix. */
  code: string
  /** `code.split("-")` — 15 tokens including "WSY1". */
  groups: string[]
  qrPayload: string
  paperVersion: number
}

export type RecoveryMaterialState =
  | { status: "preparing" }
  | { status: "ready"; material: RecoveryMaterial }
  | { status: "wiped" }
  | { status: "error"; reason: "keyLost" | "failed" }

/**
 * @param keyringLoaded whether `keyring.get()` has answered yet. **Not
 *   optional.** `isReissue` is derived from that query, and it reads `false`
 *   while it is still in flight — so starting before it resolves would take
 *   the issue path on a device that needed the reissue one, silently replacing
 *   a guardian share that a sealed copy may already depend on.
 */
export function useRecoveryMaterial(
  keyringLoaded: boolean,
  isReissue: boolean,
  authPrompt: string
): { state: RecoveryMaterialState; wipe: () => void } {
  const save = useMutation(api.keyring.save)
  const [state, setState] = useState<RecoveryMaterialState>({
    status: "preparing",
  })
  // Guards against StrictMode double-invocation and any re-render: generating
  // twice would issue two paper versions and invalidate the first silently.
  const started = useRef(false)

  const prepare = useCallback(async () => {
    try {
      // `splitRecovery` and `rotatePaperShare` both draw fresh randomness.
      ensureWebCrypto()
      const mk = await readMk(authPrompt)

      let sPaper: Uint8Array
      let mkWrappedByRecovery: Uint8Array

      if (isReissue) {
        const sGuardian = await readGuardianShare(authPrompt)
        const rotated = rotatePaperShare(mk, sGuardian)
        sPaper = rotated.sPaper
        mkWrappedByRecovery = rotated.mkWrappedByRecovery
      } else {
        const material = splitRecovery(mk)
        // Persist the guardian share first — see the ordering note above.
        await storeGuardianShare(material.sGuardian, authPrompt)
        sPaper = material.sPaper
        mkWrappedByRecovery = material.mkWrappedByRecovery
      }

      const { paperVersion } = await save({
        mkWrappedByRecovery: toArrayBuffer(mkWrappedByRecovery),
        rotatingPaper: true,
      })
      await patchEnrolment({ hasGuardianShare: true, paperVersion })

      const code = encodePaperCode(sPaper, paperVersion)
      setState({
        status: "ready",
        material: {
          code,
          groups: code.split("-"),
          qrPayload: QR_PREFIX + base64UrlEncode(mkWrappedByRecovery),
          paperVersion,
        },
      })
    } catch (error) {
      setState({
        status: "error",
        reason: error instanceof VaultKeyLostError ? "keyLost" : "failed",
      })
    }
  }, [authPrompt, isReissue, save])

  useEffect(() => {
    if (!keyringLoaded || started.current) return
    started.current = true
    void prepare()
  }, [keyringLoaded, prepare])

  const wipe = useCallback(() => setState({ status: "wiped" }), [])

  return { state, wipe }
}

/**
 * Convex `v.bytes()` is an `ArrayBuffer`. Copying rather than handing over
 * `bytes.buffer` matters: `@workspace/crypto` builds its outputs with
 * `subarray`, so the underlying buffer can be larger than the view and passing
 * it raw would ship trailing bytes.
 */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer
}
