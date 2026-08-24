import { create } from "zustand"

/**
 * The sign-up draft, alive only between 1.3 and the first authenticated write.
 *
 * `users.saveProfile` needs a session, and the session does not exist until
 * the OTP on 1.4 finalises — so the country picked on 1.3 has to be carried
 * across two screens. It is held here rather than in route params because it
 * is draft state, not navigation state, and expo-router params would put it in
 * the URL.
 *
 * **Deliberately not persisted.** Losing it costs one tap: 2.1 re-asks for the
 * country when `users.me().country` is null. Persisting draft profile data
 * across launches would mean a half-finished sign-up leaves a stale name and
 * email on disk for no benefit.
 */
type OnboardingDraft = {
  /** As typed on 1.3 — "الاسم الكامل كما في الهوية". */
  fullName: string
  email: string
  /** ISO 3166-1 alpha-2. */
  country: string
  /** True when 1.4 is verifying a brand-new account rather than a sign-in. */
  isNewAccount: boolean
}

type OnboardingState = OnboardingDraft & {
  setDraft: (patch: Partial<OnboardingDraft>) => void
  clearDraft: () => void
}

const EMPTY: OnboardingDraft = {
  fullName: "",
  email: "",
  country: "",
  isNewAccount: false,
}

export const useOnboarding = create<OnboardingState>()((set) => ({
  ...EMPTY,
  setDraft: (patch) => set(patch),
  clearDraft: () => set(EMPTY),
}))

/**
 * Split a full name the way `upsertFromClerk` will rejoin it.
 *
 * Clerk stores first and last name separately and the Convex webhook
 * reassembles them with `[first, last].filter(Boolean).join(" ")`. Splitting on
 * the **last** space therefore round-trips any Arabic name exactly —
 * "فاطمة عبدالله المنصوري" comes back byte-identical — where splitting on the
 * first would silently reorder it.
 */
export function splitFullName(fullName: string): {
  firstName: string
  lastName: string
} {
  const trimmed = fullName.trim().replace(/\s+/g, " ")
  const lastSpace = trimmed.lastIndexOf(" ")
  if (lastSpace === -1) return { firstName: trimmed, lastName: "" }
  return {
    firstName: trimmed.slice(0, lastSpace),
    lastName: trimmed.slice(lastSpace + 1),
  }
}
