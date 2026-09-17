/**
 * Paste a secret in, then take it back out of the clipboard — ٤.٣'s
 * "تُمحى الحافظة بعد اللصق". A seed phrase copied out of a wallet app sits in
 * the system clipboard indefinitely where any app can read it, Android shows it
 * in the keyboard's clipboard strip, and both platforms sync it across devices.
 *
 * Wiping is best-effort, and the limits are worth being precise about:
 *
 *  - It clears the clipboard, not the keyboard's history strip, which is a
 *    separate OS-owned store. `IME_FLAG_NO_PERSONALIZED_LEARNING` covers that,
 *    and it is set on the field, not here.
 *  - iOS 16+ prompts on read. A declined prompt returns an empty string, which
 *    reads here as "nothing to paste" — not an error, because it is a choice.
 *  - Another app can re-copy at any moment. This narrows a permanent exposure
 *    to a brief one; it does not close it.
 */
import { useCallback } from "react"
import { getStringAsync, setStringAsync } from "expo-clipboard"

export type SecretPaste = {
  /** The pasted text, or null when the clipboard was empty or refused. */
  text: string | null
  /** False when clearing threw — the caller should stop claiming it wiped. */
  wiped: boolean
}

export function useSecretPaste(): () => Promise<SecretPaste> {
  return useCallback(async () => {
    let text: string | null = null
    try {
      const value = await getStringAsync()
      text = value.length > 0 ? value : null
    } catch {
      // A declined permission prompt or an unreadable clipboard type. Nothing
      // to paste is the honest interpretation of both.
      return { text: null, wiped: true }
    }

    // Wipe even when the read produced nothing useful: whatever is in there is
    // no more welcome for having been the wrong shape.
    try {
      await setStringAsync("")
      return { text, wiped: true }
    } catch {
      return { text, wiped: false }
    }
  }, [])
}
