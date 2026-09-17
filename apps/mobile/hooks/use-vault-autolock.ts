/**
 * Drives the events that close an unlocked vault: the app leaving the
 * foreground, and the session cap elapsing.
 *
 * **Both are off under the default `LOCK_WHILE_OPEN` policy** (٩.٢). The
 * session ends with the process instead, which needs no code here — MK is
 * process memory and `useVault` has no `persist`. Choosing a duration restores
 * both events; it is a cap measured from the unlock, not an inactivity timer
 * (see `isExpired` in `stores/vault`).
 *
 * Mounted once, from the tabs layout — per-screen would run one timer per route.
 *
 * **Lock on `background` only.** A biometric prompt puts the app in `inactive`,
 * so locking on that tears the session down during the very Face ID sheet that
 * was opening it: the unlock resolves into a cleared store and the vault appears
 * to reject a fingerprint the OS accepted. The control-centre shade and an
 * incoming call produce the same state, so this is not a rare race.
 */
import { useEffect } from "react"
import { AppState, type AppStateStatus } from "react-native"

import { LOCK_WHILE_OPEN, usePreferences } from "@/stores/preferences"
import { useVault } from "@/stores/vault"

/**
 * How often the cap is checked. Coarse on purpose: a lock is allowed to be up
 * to this late, and a per-second timer would wake the JS thread 300 times to
 * answer "not yet" 299 of them.
 */
const LOCK_POLL_MS = 15 * 1000

/** Read at event time, never captured — ٩.٢ takes effect on the next tick. */
function locksOnBackground(): boolean {
  return usePreferences.getState().autoLockMinutes !== LOCK_WHILE_OPEN
}

export function useVaultAutoLock(): void {
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        // See the note above — `inactive` is the biometric prompt itself.
        if (state !== "background") return
        // "While open" means exactly that: switching apps, taking a call and
        // pulling down the shade all leave the vault as it was.
        if (!locksOnBackground()) return
        useVault.getState().lock()
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
