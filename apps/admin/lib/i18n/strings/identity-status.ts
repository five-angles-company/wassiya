import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The four Didit verification states, in words.
 *
 * Shared rather than owned by a feature: the claims workspace, the identity
 * queue and the guardians list all render an owner's or a claimant's state, and
 * `lib/identity.ts` — which is shared code — cannot import a feature's
 * dictionary without breaking the app's own import zones. Which is the rule
 * doing its job: a label three screens read was never claims-specific.
 */
export const IDENTITY_STATUS_LABELS = {
  identityVerified: { ar: "موثّقة", en: "Verified" },
  identityPending: { ar: "قيد التحقق", en: "Pending" },
  identityUnverified: { ar: "غير موثّقة", en: "Unverified" },
  identityRejected: { ar: "مرفوضة", en: "Rejected" },
} as const satisfies Dictionary
