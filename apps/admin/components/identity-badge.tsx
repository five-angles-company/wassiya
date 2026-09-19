import { Badge } from "@workspace/ui/components/badge"

import {
  identityLabel,
  identityVariant,
  type IdentityStatus,
} from "@/lib/identity"
import type { Locale } from "@/lib/i18n/locale"

/**
 * Shared rather than owned by the claims feature, which is where it started.
 * The identity queue renders the same badge over the same four states, and
 * `import/no-restricted-paths` forbids one feature reaching into another — so
 * anything two features need lives here by construction, not by preference.
 */

/**
 * The claimant's Didit state.
 *
 * This is not decoration — it is half of the rule the reviewer is applying.
 * `nameMatchOutcome` sends a claim to `awaiting_veto` only when the name
 * matches **and** the claimant is `verified`; every other combination is
 * `locked`. So a reviewer looking at an unverified claimant is looking at a
 * claim they cannot usefully approve yet, and the badge has to make that
 * obvious at a glance rather than in a tooltip.
 *
 * The label and the tone come from `lib/identity`, which the faceted filter
 * reads too — a badge and a filter option that name the same state differently
 * is how an operator ends up believing they are two different things.
 */
export function IdentityBadge({
  status,
  locale,
}: {
  status: IdentityStatus
  locale: Locale
}) {
  return (
    <Badge variant={identityVariant(status)} className="whitespace-nowrap">
      {identityLabel(status, locale)}
    </Badge>
  )
}
