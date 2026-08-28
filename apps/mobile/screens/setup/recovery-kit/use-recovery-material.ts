/**
 * Produces the paper share for 2.4, and persists the only piece of it the
 * server is ever allowed to see.
 *
 * The ordering here is the security-critical part:
 *
 *  1. `S_paper` is **never persisted anywhere**. It lives in this hook's return
 *     value for the life of one screen and is dropped once the sheet is out.
 *     That is what makes "we keep no copy" literally true.
 *  2. Only `mkWrappedByRecovery` crosses the wire. It is MK under
 *     K_rec = S_paper, and the deployment holds neither operand.
 *  3. The wrapper is sealed under an AAD of the owner's id and the paper
 *     version it is *about to become*, so the version has to be decided here,
 *     before the ciphertext exists — which is why `save` is told the number
 *     rather than choosing it. It refuses a version that does not follow from
 *     the stored row, so the two can never drift apart.
 *
 * ## One path, where there used to be two
 *
 * Issuing and reissuing used to differ: a reissue had to read `S_guardian` out
 * of the keystore to re-derive K_rec. With the guardian gone from recovery,
 * both are the same act — mint a fresh share, wrap, save — and the only thing
 * that varies is the version number.
 *
 * Re-entering after abandoning an unprinted sheet therefore still **rotates**
 * rather than reprints: `S_paper` is gone, so the honest move is a new paper
 * version. The abandoned code stops working the moment the new wrapper lands.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import { encodePaperCode } from "@workspace/crypto/papercode"
import { rotatePaperShare, splitRecovery } from "@workspace/crypto/recovery"

import { base64UrlEncode } from "@/lib/base64"
import { ensureWebCrypto } from "@/lib/crypto-polyfill"
import { patchEnrolment, readMk, VaultKeyLostError } from "@/lib/secure-vault"

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
 * Everything the wrapper's AAD needs, or `null` while the queries behind it are
 * still in flight.
 *
 * One object rather than two arguments, deliberately. The previous shape took a
 * `keyringLoaded` flag beside a derived boolean, because "still loading" and
 * "no keyring yet" both read as `false` and only one of them was true — a
 * caller who forgot the flag would start on the wrong branch. Here there is no
 * flag to forget: until every input has answered there is nothing to pass.
 */
export type RecoveryContext = {
  userId: string
  /** `keyring.paperVersion`, or `null` when no keyring row exists yet. */
  currentPaperVersion: number | null
}

export function useRecoveryMaterial(
  context: RecoveryContext | null,
  authPrompt: string
): { state: RecoveryMaterialState; wipe: () => void } {
  const save = useMutation(api.keyring.save)
  const [state, setState] = useState<RecoveryMaterialState>({
    status: "preparing",
  })
  // Guards against StrictMode double-invocation and any re-render: generating
  // twice would issue two paper versions and invalidate the first silently.
  const started = useRef(false)

  const prepare = useCallback(
    async (ctx: RecoveryContext) => {
      try {
        // Both mint functions draw fresh randomness.
        ensureWebCrypto()
        const mk = await readMk(authPrompt)

        // Always a rotation from the server's point of view, so the next
        // version is this one plus one — or the first, when there is no row.
        const paperVersion =
          ctx.currentPaperVersion === null ? 1 : ctx.currentPaperVersion + 1

        const { sPaper, mkWrappedByRecovery } =
          ctx.currentPaperVersion === null
            ? splitRecovery(mk, ctx.userId, paperVersion)
            : rotatePaperShare(mk, ctx.userId, paperVersion)

        await save({
          mkWrappedByRecovery: toArrayBuffer(mkWrappedByRecovery),
          paperVersion,
          rotatingPaper: true,
        })
        await patchEnrolment({ paperVersion })

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
    },
    [authPrompt, save]
  )

  useEffect(() => {
    if (context === null || started.current) return
    started.current = true
    void prepare(context)
  }, [context, prepare])

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
