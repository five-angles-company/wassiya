/**
 * Drives the two events that close an unlocked vault: the app leaving the
 * foreground, and the session cap elapsing.
 *
 * The cap is measured from the unlock and nothing extends it — see
 * `AUTO_LOCK_MS`, which explains why this is not the inactivity timer ٩.٢ will
 * eventually want.
 *
 * Mounted **once**, from the tabs layout — the vault is only reachable from
 * there, and mounting it per screen would run one timer per mounted route.
 *
 * ## The iOS trap this encodes
 *
 * A biometric prompt puts the app in `inactive`, not `background`. Locking on
 * anything other than `background` therefore tears the session down *during*
 * the very Face ID sheet that was opening it — the unlock resolves into a
 * store that has already been cleared, and the vault appears to reject a
 * fingerprint the OS accepted. The control-centre shade and an incoming call
 * produce the same `inactive` state, so this is not a rare race. Lock on
 * `background` only.
 */
import { useEffect } from "react"
import { AppState, type AppStateStatus } from "react-native"

import { useVault } from "@/stores/vault"

/**
 * How often the cap is checked. Coarse on purpose: a lock is allowed to be up
 * to this late, and a per-second timer would wake the JS thread 300 times to
 * answer "not yet" 299 of them.
 */
const LOCK_POLL_MS = 15 * 1000

export function useVaultAutoLock(): void {
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        // See the note above — `inactive` is the biometric prompt itself.
        if (state === "background") useVault.getState().lock()
      }
    )

    const timer = setInterval(() => {
      const vault = useVault.getState()
      if (vault.isExpired(Date.now())) vault.lock()
    }, LOCK_POLL_MS)

    return () => {
      subscription.remove()
      clearInterval(timer)
    }
  }, [])
}
