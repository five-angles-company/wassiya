/**
 * Paste a secret in, then take it back out of the clipboard.
 *
 * 4.3's third safety chip is "تُمحى الحافظة بعد اللصق" — the clipboard is wiped
 * after pasting — and it is the one that most needs to be true. A seed phrase
 * copied out of a wallet app sits in the system clipboard indefinitely, where
 * *any* app can read it, Android shows it in the keyboard's clipboard strip,
 * and both platforms sync it to other devices. Reading the phrase without
 * clearing it would leave the app's own convenience feature as the largest hole
 * in the screen.
 *
 * Wiping is best-effort and worth being precise about:
 *
 *  - It clears the clipboard, not the keyboard's *history* strip, which is a
 *    separate store the OS owns. `IME_FLAG_NO_PERSONALIZED_LEARNING` on the
 *    input is what covers that, and it is set on the field, not here.
 *  - iOS 16+ shows a paste-permission prompt on read. A user who declines gets
 *    an empty string back, which reads here as "nothing to paste" — not an
 *    error, because it is a choice.
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
