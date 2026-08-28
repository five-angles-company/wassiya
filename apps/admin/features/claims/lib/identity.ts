import { CLAIMS } from "@/features/claims/strings/claims"
import { t, type Locale } from "@/lib/i18n/locale"

/**
 * The four Didit states, in the order a claimant moves through them.
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
 * Extracted from `IdentityBadge` when the facet needed the same labels: a badge
 * and a filter option that disagree about what "pending" is called is the exact
 * drift that makes an operator think they are two different things.
 */
export function identityLabel(status: IdentityStatus, locale: Locale): string {
  const labels = t(CLAIMS, locale)
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
