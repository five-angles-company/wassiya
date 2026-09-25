import { t, type Locale } from "@/lib/i18n/locale"
import { IDENTITY_STATUS_LABELS } from "@/lib/i18n/strings/identity-status"

/**
 * The four Didit states, in the order a user moves through them.
 *
 * Mirrors `identityStatus` in `packages/backend/convex/schema.ts`. The order is
 * the facet's render order, so it reads as a progression rather than as an
 * alphabetised list.
 */
export const IDENTITY_STATUSES = [
  "unverified",
  "pending",
  "verified",
  "rejected",
] as const

export type IdentityStatus = (typeof IDENTITY_STATUSES)[number]

/**
 * One identity state, in words.
 *
 * App-level rather than feature-level because several screens read it — the
 * identity queue, the owners list and support all render a user's
 * verification state. A badge and a filter option that
 * disagree about what "pending" is called is the exact drift that makes an
 * operator think they are two different things.
 */
export function identityLabel(status: IdentityStatus, locale: Locale): string {
  const labels = t(IDENTITY_STATUS_LABELS, locale)
  const map: Record<IdentityStatus, string> = {
    unverified: labels.identityUnverified,
    pending: labels.identityPending,
    verified: labels.identityVerified,
    rejected: labels.identityRejected,
  }
  return map[status]
}

/** Badge tone for a state. `verified` is the only one that reads as settled. */
export function identityVariant(
  status: IdentityStatus
): "secondary" | "destructive" | "outline" {
  if (status === "verified") return "secondary"
  if (status === "rejected") return "destructive"
  return "outline"
}
