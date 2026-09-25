import { Badge } from "@workspace/ui/components/badge"

import {
  identityLabel,
  identityVariant,
  type IdentityStatus,
} from "@/lib/identity"
import type { Locale } from "@/lib/i18n/locale"

/**
 * A user's Didit state. Shared rather than feature-owned because several
 * features render it, and `import/no-restricted-paths` forbids one feature
 * reaching into another.
 *
 * The label and the tone come from `lib/identity`, which the faceted filters
 * read too — a badge and a filter option that name the same state differently
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
