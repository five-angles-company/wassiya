/**
 * The unlocked vault session — MK held in memory, for as long as the auto-lock
 * policy allows and not a second longer.
 *
 * `secure-vault.readMk` raises a biometric prompt on **every** call, which was
 * fine while exactly one screen used it (the 2.4 ceremony, once). Section ٤
 * changes that: every asset row's label is sealed under its own DEK, which is
 * wrapped under MK, so rendering a list of forty assets would mean forty Face
 * ID sheets. This store exists so the prompt happens once and the key is then
 * reused — which is the same trade every vault app makes, and the reason
 * auto-lock is part of the same file rather than a later nicety.
 *
 * ## Rules this store is the enforcement point for
 *
 * - **MK is never persisted.** Not through `persist`, not to AsyncStorage, not
 *   to SecureStore — the keystore already holds the only at-rest copy, behind
 *   biometrics. This is process memory that dies with the app, and `lock()`
 *   zeroes the buffer after publishing the lock (see the ordering note there,
 *   which is load-bearing).
 * - **`VaultKeyLostError` is a route, not an error to swallow.** Changing the
 *   device's enrolled biometrics invalidates MK permanently; the only honest
 *   destination is the recovery ceremony. `status: "lost"` says so, and
 *   `useVaultGate` turns it into a redirect.
 * - **One prompt at a time.** Two components mounting together and both
 *   calling `unlock()` would otherwise stack two biometric sheets, the second
 *   of which the OS may simply reject. In-flight calls share one promise.
 *
 * Server state still belongs to Convex — this holds a *key*, which is the one
 * thing Convex must never see, so the usual "don't mirror server state into
 * Zustand" rule does not apply to it.
 */
import { create } from "zustand"

import { readMk, VaultKeyLostError } from "@/lib/secure-vault"

/**
 * How long an unlocked vault survives before it closes itself.
 *
 * **This is a session cap, not an inactivity timer.** It is measured from the
 * unlock, and nothing extends it — a real "five minutes since the user last did
 * something" needs a source of interaction events (a root-level responder, or a
 * navigation subscription), and this app has neither yet. Saying so plainly
 * because the alternative is a store that claims to track idleness, stamps its
 * timestamp exactly once, and locks a reader out mid-scroll anyway.
 *
 * Section ٩.٢ ("القفل التلقائي") owns both the value and the policy, and has
 * never been read off the board — the 256 KiB `get_file` cap stops before it.
 * Five minutes is the placeholder, named here so that session retunes it in one
 * place instead of hunting for a literal.
 */
export const AUTO_LOCK_MS = 5 * 60 * 1000

export type VaultStatus =
  /** No key in memory. The normal resting state. */
  | "locked"
  /** A biometric prompt is on screen. */
  | "unlocking"
  | "unlocked"
  /** The keystore invalidated MK. Only the recovery ceremony helps. */
  | "lost"

export type VaultState = {
  status: VaultStatus
  /**
   * Null unless `status === "unlocked"`. Never persisted, never sent.
   *
   * Read it by subscribing (`useVault((s) => s.mk)`) rather than through a
   * getter: a getter hands back the key without telling React anything moved,
   * so a list that decrypted on unlock would never notice the lock.
   */
  mk: Uint8Array | null
  /** When the session opened. See {@link AUTO_LOCK_MS} — it is a cap, not idle. */
  unlockedAt: number | null
  unlock: (authenticationPrompt: string) => Promise<void>
  lock: () => void
  /** True when the session cap has elapsed. The auto-lock hook polls this. */
  isExpired: (now: number) => boolean
}

/**
 * Shared across concurrent `unlock()` calls so the OS only ever sees one
 * prompt. Module-scoped rather than store state because it is a coordination
 * detail no component should be able to subscribe to or reset.
 */
let inFlight: Promise<void> | null = null

export const useVault = create<VaultState>()((set, get) => ({
  status: "locked",
  mk: null,
  unlockedAt: null,

  unlock: async (authenticationPrompt) => {
    if (get().status === "unlocked") return
    if (inFlight !== null) return inFlight

    inFlight = (async () => {
      set({ status: "unlocking" })
      try {
        const mk = await readMk(authenticationPrompt)
        set({ status: "unlocked", mk, unlockedAt: Date.now() })
      } catch (error) {
        if (error instanceof VaultKeyLostError) {
          // Terminal for this device. Deliberately *not* rethrown: every
          // caller would have to re-derive the same "send them to recovery"
          // conclusion, and one that forgot would show a retry button for a
          // prompt that can never succeed again.
          set({ status: "lost", mk: null, unlockedAt: null })
          return
        }
        // A cancelled prompt lands here, which is not a failure — the user
        // declined, and the vault stays shut until they ask again.
        set({ status: "locked", mk: null, unlockedAt: null })
      } finally {
        inFlight = null
      }
    })()

    return inFlight
  },

  lock: () => {
    const { mk, status } = get()
    // Publish the lock BEFORE zeroing. `fill` mutates in place, and the assets
    // list closes over this exact `Uint8Array` — zeroing first would leave a
    // subscriber holding a present-but-all-zero key, and every row would
    // decrypt to "تعذّر فك التشفير", which reads as a corrupted vault rather
    // than a locked one. After `set`, no subscriber can reach it.
    //
    // "lost" must survive a lock: the device still cannot produce a key, and
    // downgrading it to "locked" would offer a prompt that always fails.
    set({
      status: status === "lost" ? "lost" : "locked",
      mk: null,
      unlockedAt: null,
    })
    // Best-effort hygiene, not a guarantee: `readMk` decodes MK from a hex
    // string, and JS strings are immutable, so a copy of the key survives in
    // the string pool either way. This removes the binary one.
    mk?.fill(0)
  },

  isExpired: (now) => {
    const { status, unlockedAt } = get()
    if (status !== "unlocked" || unlockedAt === null) return false
    return now - unlockedAt >= AUTO_LOCK_MS
  },
}))
