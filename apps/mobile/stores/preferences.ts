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
   * Minutes an unlocked vault survives. See `AUTO_LOCK_MS` in `stores/vault`
   * for what this actually measures — it is a session cap, not an idle timer.
   */
  autoLockMinutes: number
  setAutoLockMinutes: (minutes: number) => void
}

/** The choices ٩.٢ offers. Immediate is the strictest the model allows. */
export const AUTO_LOCK_CHOICES = [1, 5, 15, 60] as const

/** Matches the board's "قُفلت تلقائياً بعد ٥ دقائق" on 3.2. */
export const DEFAULT_AUTO_LOCK_MINUTES = 5

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
      // That matters for auto-lock specifically: until rehydration lands the
      // vault uses the 5-minute default, which is the *stricter* end of the
      // range for anyone who chose 15 or 60. Erring tight rather than loose is
      // the right way round for a lock.
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
