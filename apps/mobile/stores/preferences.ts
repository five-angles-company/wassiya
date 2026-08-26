import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

/**
 * Client-only UI state, persisted to AsyncStorage.
 *
 * IMPORTANT: Convex (useQuery/useMutation) is the source of truth for *server*
 * state. Keep only client/UI state here (ephemeral flags, local preferences,
 * draft state) — do NOT mirror server entities into Zustand.
 *
 * ## Why auto-lock lives here and not on the user record
 *
 * ٩.٢ tunes how long an unlocked vault survives. That is a **per-device**
 * decision, not a per-account one: the phone in someone's pocket and the tablet
 * on the kitchen table do not warrant the same window, and syncing the setting
 * would let a change made on the safest device silently loosen the least safe
 * one. It is also not a secret — it is a duration — so AsyncStorage is the
 * right store, unlike anything in `secure-vault.ts`.
 */
export type PreferencesState = {
  hasSeenWelcome: boolean
  setHasSeenWelcome: (value: boolean) => void

  /**
   * Minutes an unlocked vault survives, or {@link LOCK_WHILE_OPEN} to keep it
   * open for the life of the process. A duration is a session cap, not an idle
   * timer — `isExpired` in `stores/vault` explains why.
   */
  autoLockMinutes: number
  setAutoLockMinutes: (minutes: number) => void
}

/**
 * "ما دام التطبيق مفتوحاً" — no timer, and backgrounding does not lock either.
 * The session then ends only when the process does, which needs no code at all:
 * MK is plain process memory and `useVault` has no `persist`, so a cold start
 * is always locked.
 *
 * Named rather than compared against a bare `0` in four files, because `0`
 * reads like "lock immediately" — the exact opposite of what it means here.
 */
export const LOCK_WHILE_OPEN = 0

/** The choices ٩.٢ offers, loosest first. */
export const AUTO_LOCK_CHOICES = [LOCK_WHILE_OPEN, 1, 5, 15, 60] as const

/**
 * Staying open while the app is open is the default, at the owner's request.
 *
 * The trade is stated on ٩.٢ rather than buried: anyone holding the unlocked
 * phone can reopen Wassiya from the app switcher and read the vault. A seed
 * phrase still needs a fingerprint to *display*, which is the one gate that
 * survives this setting.
 */
export const DEFAULT_AUTO_LOCK_MINUTES = LOCK_WHILE_OPEN

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      hasSeenWelcome: false,
      setHasSeenWelcome: (value) => set({ hasSeenWelcome: value }),

      autoLockMinutes: DEFAULT_AUTO_LOCK_MINUTES,
      setAutoLockMinutes: (minutes) => set({ autoLockMinutes: minutes }),
    }),
    {
      name: "preferences",
      // AsyncStorage is async, so the store rehydrates after the first render
      // (initial render shows defaults). No SSR hydration concern on native.
      //
      // For auto-lock that gap now errs *loose* rather than tight, because the
      // default is "while open". It is a sub-frame window before rehydration
      // lands, and erring tight instead would flash a locked vault open.
      version: 1,
      /**
       * v0 shipped a five-minute cap as the default. Anyone who never opened
       * ٩.٢ still carries that 5 in storage, so changing the default alone
       * would do nothing on an existing install — the persisted value wins.
       *
       * Only the *old default* moves. An explicit 1, 15 or 60 is a choice
       * someone made and is left exactly as it is. A 5 that was chosen rather
       * than inherited is indistinguishable from one that was not and gets
       * migrated too; ٩.٢ is one tap away for anyone who wants it back.
       */
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<PreferencesState>
        if (version === 0 && state.autoLockMinutes === 5) {
          return { ...state, autoLockMinutes: LOCK_WHILE_OPEN }
        }
        return state
      },
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
