/**
 * The unsaved letter, so ٤.٨ can be left and come back to. A note is written
 * over minutes, and losing a half-written letter to a phone call is the one
 * thing that must not happen.
 *
 * It is the only draft the app persists: `stores/onboarding.ts` deliberately
 * does not, because losing that costs one tap, where this costs a page of
 * writing that existed nowhere else.
 *
 * **AsyncStorage is not encrypted.** That is acceptable for composing text and
 * nothing else — ٤.٣ and ٤.٧ have no equivalent and must not grow one. The
 * draft is cleared the moment the note is encrypted and saved, so the plaintext
 * copy never outlives its ciphertext.
 */
import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type NoteDraft = {
  kind: string
  title: string
  body: string
  /** Epoch millis of the last change, for the "saved N ago" line. */
  savedAt: number | null
}

type NoteDraftState = NoteDraft & {
  update: (patch: Partial<Omit<NoteDraft, "savedAt">>) => void
  clear: () => void
  /** True once rehydration has run, so the screen does not flash empty. */
  ready: boolean
  setReady: () => void
}

const EMPTY = {
  kind: "instructions",
  title: "",
  body: "",
  savedAt: null,
} satisfies NoteDraft

export const useNoteDraft = create<NoteDraftState>()(
  persist(
    (set) => ({
      ...EMPTY,
      ready: false,
      setReady: () => set({ ready: true }),
      // Every edit stamps the time; the screen renders it rather than running
      // its own debounce, so "saved" means the state actually moved.
      update: (patch) => set({ ...patch, savedAt: Date.now() }),
      clear: () => set({ ...EMPTY }),
    }),
    {
      name: "note-draft",
      storage: createJSONStorage(() => AsyncStorage),
      // `ready` and the actions are runtime-only; persisting `ready` would
      // rehydrate as true before rehydration had happened.
      partialize: (state) => ({
        kind: state.kind,
        title: state.title,
        body: state.body,
        savedAt: state.savedAt,
      }),
      onRehydrateStorage: () => (state) => state?.setReady(),
    }
  )
)
