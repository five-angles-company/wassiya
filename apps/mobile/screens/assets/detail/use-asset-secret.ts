/**
 * The reveal half of ٤.٩'s two-tier decryption.
 *
 * The board draws the line precisely: *"metadata on open, the secret only
 * behind a fresh biometric that self-hides after 10s; every reveal writes an
 * audit entry (9.3)"*. Three properties fall out of that, and each is here
 * rather than in the screen because each is easy to lose in markup:
 *
 * 1. **Fresh, every time.** An unlocked vault is not permission to see a seed
 *    phrase. `useVault` already holds MK — the biometric here is a *second*
 *    gate, and it is re-taken on every reveal, including a second reveal one
 *    minute after the first. Caching the plaintext across reveals would quietly
 *    turn ten seconds of exposure into a whole session's worth.
 * 2. **It hides itself.** The countdown runs whether or not the user does
 *    anything — walking away is the case the timer exists for — and unmounting
 *    or backgrounding clears it too.
 * 3. **The reveal is recorded once it can succeed, and before it is shown.**
 *    `recordReveal` is awaited after the payload decrypts and before it
 *    reaches state. Logging earlier — at the biometric — would stamp "revealed"
 *    on every failed download and every corrupt blob, and the stamp under the
 *    button is the owner's evidence that something *was* read. Evidence that
 *    fires on failures is worth less than none.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { decryptAsset } from "@workspace/crypto/asset"
import { bytesToUtf8 } from "@workspace/crypto/bytes"
import { unwrap } from "@workspace/crypto/wrap"
import * as LocalAuthentication from "expo-local-authentication"

import { downloadCiphertext } from "@/lib/asset-upload"
import { useVault } from "@/stores/vault"

/** The board's peek window. */
export const REVEAL_SECONDS = 10

export type SecretState =
  | { status: "hidden" }
  | { status: "working" }
  /** Plaintext in memory, with the seconds left on its own countdown. */
  | { status: "revealed"; text: string; secondsLeft: number }
  | { status: "denied" }
  | { status: "failed" }

export function useAssetSecret(
  assetId: Id<"assets">,
  promptMessage: string
): { state: SecretState; reveal: (url: string, dekWrapped: ArrayBuffer) => void; hide: () => void } {
  const recordReveal = useMutation(api.assets.recordReveal)
  const [state, setState] = useState<SecretState>({ status: "hidden" })
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    if (timer.current !== null) clearInterval(timer.current)
    timer.current = null
  }, [])

  const hide = useCallback(() => {
    stop()
    setState({ status: "hidden" })
  }, [stop])

  // Nothing may outlive the screen: leaving with a phrase on display must not
  // leave the plaintext reachable from a retained closure.
  useEffect(() => stop, [stop])

  const reveal = useCallback(
    (url: string, dekWrapped: ArrayBuffer) => {
      void (async () => {
        setState({ status: "working" })
        try {
          const auth = await LocalAuthentication.authenticateAsync({
            promptMessage,
            // No passcode escape hatch. The vault's own unlock already accepts
            // one; this gate exists to prove a *person* is present for the ten
            // seconds a seed phrase is on screen.
            disableDeviceFallback: true,
          })
          if (!auth.success) {
            setState({ status: "denied" })
            return
          }

          const mk = useVault.getState().mk
          if (mk === null) {
            setState({ status: "failed" })
            return
          }

          const dek = unwrap(new Uint8Array(dekWrapped), mk)
          try {
            const text = bytesToUtf8(
              decryptAsset(await downloadCiphertext(url), dek)
            )
            // Decrypted and about to be shown — see the note above on why the
            // write sits here rather than at the biometric.
            await recordReveal({ assetId })
            setState({ status: "revealed", text, secondsLeft: REVEAL_SECONDS })
            stop()
            timer.current = setInterval(() => {
              setState((current) => {
                if (current.status !== "revealed") return current
                const secondsLeft = current.secondsLeft - 1
                if (secondsLeft > 0) return { ...current, secondsLeft }
                stop()
                return { status: "hidden" }
              })
            }, 1000)
          } finally {
            dek.fill(0)
          }
        } catch {
          setState({ status: "failed" })
        }
      })()
    },
    [assetId, promptMessage, recordReveal, stop]
  )

  return { state, reveal, hide }
}
