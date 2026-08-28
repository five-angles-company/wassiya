import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The five states a guardian appointment can be in.
 *
 * Shared rather than owned by the guardians feature: the owner detail renders
 * the same badge over the same five values, and `lib/guardian-state.ts` is
 * shared code, which may not import a feature's dictionary. Two screens naming
 * the same state differently is the drift this prevents.
 */
export const GUARDIAN_STATE_LABELS = {
  stateLive: { ar: "فعّال", en: "Live" },
  stateAccepted: { ar: "قبل، بلا مفتاح", en: "Accepted, no key" },
  stateInvited: { ar: "بانتظار القبول", en: "Awaiting acceptance" },
  stateExpired: { ar: "انتهت الدعوة", en: "Invitation expired" },
  stateRevoked: { ar: "مُلغى", en: "Revoked" },
} as const satisfies Dictionary
