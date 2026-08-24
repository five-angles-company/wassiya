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
 *   zeroes the bytes before dropping them so a heap snapshot taken after a
 *   lock does not still contain the key.
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
 * How long an unlocked vault survives without being used.
 *
 * Section ٩.٢ ("القفل التلقائي") owns this value and has never been read off
 * the board — the 256 KiB `get_file` cap stops before it. Five minutes is the
 * placeholder, named here so that session can retune it in one place instead of
 * hunting for a literal.
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
  /** Null unless `status === "unlocked"`. Never persisted, never sent. */
  mk: Uint8Array | null
  /** When the key was last handed out, for the idle timer. */
  lastUsedAt: number | null
  unlock: (authenticationPrompt: string) => Promise<void>
  lock: () => void
  /**
   * The session key, or null when locked. Reading it counts as using the
   * vault and restarts the idle clock, so a user working through their assets
   * is never locked out mid-task.
   */
  useMk: () => Uint8Array | null
  /** True when the idle window has elapsed. The hook polls this. */
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
  lastUsedAt: null,

  unlock: async (authenticationPrompt) => {
    if (get().status === "unlocked") return
    if (inFlight !== null) return inFlight

    inFlight = (async () => {
      set({ status: "unlocking" })
      try {
        const mk = await readMk(authenticationPrompt)
        set({ status: "unlocked", mk, lastUsedAt: Date.now() })
      } catch (error) {
        if (error instanceof VaultKeyLostError) {
          // Terminal for this device. Deliberately *not* rethrown: every
          // caller would have to re-derive the same "send them to recovery"
          // conclusion, and one that forgot would show a retry button for a
          // prompt that can never succeed again.
          set({ status: "lost", mk: null, lastUsedAt: null })
          return
        }
        // A cancelled prompt lands here, which is not a failure — the user
        // declined, and the vault stays shut until they ask again.
        set({ status: "locked", mk: null, lastUsedAt: null })
      } finally {
        inFlight = null
      }
    })()

    return inFlight
  },

  lock: () => {
    const { mk, status } = get()
    // Zero before dropping the reference. `fill` mutates the same buffer the
    // keystore read produced, so nothing else can be holding a live view of it.
    mk?.fill(0)
    // "lost" must survive a lock: the device still cannot produce a key, and
    // downgrading it to "locked" would offer a prompt that always fails.
    set({
      status: status === "lost" ? "lost" : "locked",
      mk: null,
      lastUsedAt: null,
    })
  },

  useMk: () => {
    const { mk } = get()
    if (mk === null) return null
    set({ lastUsedAt: Date.now() })
    return mk
  },

  isExpired: (now) => {
    const { status, lastUsedAt } = get()
    if (status !== "unlocked" || lastUsedAt === null) return false
    return now - lastUsedAt >= AUTO_LOCK_MS
  },
}))
