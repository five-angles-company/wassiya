import { Badge } from "@workspace/ui/components/badge"

import { t, type Locale } from "@/lib/i18n/locale"
import { CLAIMS } from "@/features/claims/strings/claims"

type IdentityStatus = "unverified" | "pending" | "verified" | "rejected"

/**
 * The claimant's Didit state.
 *
 * This is not decoration — it is half of the rule the reviewer is applying.
 * `nameMatchOutcome` sends a claim to `guardian_review` only when the name
 * matches **and** the claimant is `verified`; every other combination is
 * `locked`. So a reviewer looking at an unverified claimant is looking at a
 * claim they cannot usefully approve yet, and the badge has to make that
 * obvious at a glance rather than in a tooltip.
 */
export function IdentityBadge({
  status,
  locale,
}: {
  status: IdentityStatus
  locale: Locale
}) {
  const labels = t(CLAIMS, locale)

  const variant =
    status === "verified"
      ? "secondary"
      : status === "rejected"
        ? "destructive"
        : "outline"

  const label =
    status === "verified"
      ? labels.identityVerified
      : status === "pending"
        ? labels.identityPending
        : status === "rejected"
          ? labels.identityRejected
          : labels.identityUnverified

  return (
    <Badge variant={variant} className="whitespace-nowrap">
      {label}
    </Badge>
  )
}
