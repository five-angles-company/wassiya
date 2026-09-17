/**
 * The screen-facing half of the vault session: whether to ask for a fingerprint,
 * render, or leave because this device is finished.
 *
 * Unlocking is **user-initiated, never automatic**. ٤.١ shows an assets list,
 * not a lock screen, and a biometric sheet firing on tab focus would ambush
 * anyone who tapped الأصول to check a count. The screen renders its own
 * affordance and calls `unlock` from a press handler.
 *
 * The one thing this hook does on its own is leave. `status: "lost"` means the
 * keystore invalidated MK, and no amount of retrying inside section ٤ produces a
 * key again — so the redirect to recovery belongs here rather than in each
 * screen that might be first to notice.
 */
import { useCallback, useEffect } from "react"
import { router } from "expo-router"

import { useStrings } from "@/i18n/use-strings"
import { useVault, type VaultStatus } from "@/stores/vault"

export type VaultGate = {
  status: VaultStatus
  /** True only while a key is in memory. */
  unlocked: boolean
  /** Raises the biometric prompt. Safe to call twice; the second is a no-op. */
  unlock: () => void
}

export function useVaultGate(): VaultGate {
  const { t } = useStrings("common")
  const status = useVault((s) => s.status)
  const unlockKey = useVault((s) => s.unlock)

  useEffect(() => {
    // `replace`, not `push`: there is nothing to come back to. The tabs behind
    // this are unusable without a key, and a back gesture that returned to a
    // permanently locked vault would be a trap.
    if (status === "lost") router.replace("/recovery")
  }, [status])

  const unlock = useCallback(() => {
    void unlockKey(t.unlockPrompt)
  }, [t.unlockPrompt, unlockKey])

  return { status, unlocked: status === "unlocked", unlock }
}
