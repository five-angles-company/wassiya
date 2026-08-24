/**
 * The unsaved letter, so ٤.٨ can be left and come back to.
 *
 * The board shows "حُفظت قبل ٤ ثوانٍ" under the title — a note is written over
 * minutes, not filled in like a form, and the one thing that must never happen
 * is losing a half-written letter to a phone call. This is that draft.
 *
 * ## Why this is the one draft the app persists
 *
 * `stores/onboarding.ts` deliberately does **not** persist its draft, and gives
 * the reason: losing it costs one tap. This is the opposite case — losing it
 * costs a page of writing that only existed here.
 *
 * ## What it is safe to keep, and what it is not
 *
 * AsyncStorage is **not** encrypted. That is acceptable for exactly this and
 * nothing else: a note in progress is text the user is composing, not key
 * material, and it is unreachable without the device unlock. A seed phrase or a
 * password draft would not be acceptable here, which is why 4.3 and 4.7 have no
 * equivalent and must not grow one.
 *
 * The draft is cleared the moment the note is encrypted and saved, so the
 * plaintext copy does not outlive its ciphertext.
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
