/**
 * Mints the paper share for the recovery kit. Mint → display → confirm → save:
 *
 *  1. `S_paper` is **never persisted anywhere**. It lives in this hook's return
 *     value for the life of one screen — that is what makes "we keep no copy"
 *     literally true.
 *  2. **Nothing is written on mount.** The wrapper is saved only by `commit`,
 *     which the screen calls once the owner confirms the new sheet is in their
 *     hands. Until then the previous sheet keeps working and leaving costs
 *     nothing; saving first would retire it in favour of a code printed nowhere.
 *  3. The wrapper is sealed under an AAD of the owner's id and the paper
 *     version it is about to become, so the version is decided here, before the
 *     ciphertext exists — which is why `save` is told the number rather than
 *     choosing it, and refuses one that does not follow from the stored row.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@clerk/expo"
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
 * still in flight — "still loading" and "no keyring yet" must never share a
 * value, or a caller starts on the wrong branch.
 */
export type RecoveryContext = {
  userId: string
  /** `keyring.paperVersion`, or `null` when no keyring row exists yet. */
  currentPaperVersion: number | null
}

export function useRecoveryMaterial(
  context: RecoveryContext | null,
  authPrompt: string
): {
  state: RecoveryMaterialState
  /** Saves the wrapper, stamped printed. Resolves false when it did not land. */
  commit: () => Promise<boolean>
  wipe: () => void
  retry: () => void
} {
  const save = useMutation(api.keyring.save)
  const owner = useAuth().userId ?? null
  const [state, setState] = useState<RecoveryMaterialState>({
    status: "preparing",
  })
  const wrapped = useRef<ArrayBuffer | null>(null)
  // Guards against StrictMode double-invocation and any re-render: minting
  // twice would show one code and save another.
  const started = useRef(false)

  const prepare = useCallback(
    async (ctx: RecoveryContext) => {
      try {
        ensureWebCrypto()
        if (owner === null) throw new Error("Signed out")
        const mk = await readMk(owner, authPrompt)

        // Always a rotation from the server's point of view, so the next
        // version is this one plus one — or the first, when there is no row.
        const paperVersion =
          ctx.currentPaperVersion === null ? 1 : ctx.currentPaperVersion + 1

        const { sPaper, mkWrappedByRecovery } =
          ctx.currentPaperVersion === null
            ? splitRecovery(mk, ctx.userId, paperVersion)
            : rotatePaperShare(mk, ctx.userId, paperVersion)
        mk.fill(0)

        wrapped.current = toArrayBuffer(mkWrappedByRecovery)
        const code = encodePaperCode(sPaper, paperVersion)
        sPaper.fill(0)
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
    [authPrompt, owner]
  )

  useEffect(() => {
    if (context === null || started.current) return
    started.current = true
    void prepare(context)
  }, [context, prepare])

  const commit = useCallback(async () => {
    if (state.status !== "ready" || wrapped.current === null) return false
    const { paperVersion } = state.material
    try {
      await save({
        mkWrappedByRecovery: wrapped.current,
        paperVersion,
        rotatingPaper: true,
        printed: true,
      })
    } catch {
      return false
    }
    try {
      if (owner !== null) await patchEnrolment(owner, { paperVersion })
    } catch {
      // The local marker is this install's own record, not a routing input;
      // the server row just written is the truth.
    }
    return true
  }, [owner, save, state])

  const wipe = useCallback(() => {
    wrapped.current = null
    setState({ status: "wiped" })
  }, [])

  const retry = useCallback(() => {
    if (context === null) return
    setState({ status: "preparing" })
    void prepare(context)
  }, [context, prepare])

  return { state, commit, wipe, retry }
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
