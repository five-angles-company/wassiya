import type { Metadata } from "next"

import { GuardianKey } from "@/features/guardian/components/guardian-key"

/**
 * The guardian's key: is the sheet in the drawer still the right one, and can I
 * print it again.
 *
 * ## 🚨 Why it is a route at all, rather than a block on another page
 *
 * It used to live on `/guardian`, and `/guardian` was reachable from exactly one
 * place — `case-router.tsx`'s redirect, on the single row of its table where a
 * guardian has vaults and **no duty pending**. Nothing else in the app linked
 * there: `PageTop` holds no destinations by design and the account menu had
 * two items, neither of them this.
 *
 * So a guardian with a duty waiting was routed straight past it to the duty, and
 * had no way back. The one moment a guardian is most likely to want to check
 * their key — the week they are asked to act — was the one moment they could not
 * reach it. That is the hole this route closes, and it is why the entry point is
 * the account menu: a thing you need on no particular schedule belongs where you
 * look for your own settings, not on a page you are routed to by having nothing
 * to do.
 *
 * ## ⚠️ It stays under `/guardian/` although `/guardian` itself is gone
 *
 * `lib/surface.ts` maps the guardian's world by the `/guardian` **prefix**, and
 * its own docstring says that map and `app/(app)/(guardian)` are *"one decision
 * in two places… change both or neither"*. Keeping the path means the surface
 * follows with no second edit — and a guardian screen reading as the heir's
 * terracotta would tell this reader they are somewhere they are not.
 *
 * ⚠️ **A static segment beside `[claimId]`.** Next matches `key` before the
 * dynamic route, and claim ids are 32 random characters, so nothing real is
 * shadowed.
 *
 * ## ⚠️ It renders for a non-guardian too
 *
 * The menu row is unconditional — asking the header for a guardianship on every
 * page in the app is a subscription per page to hide one row. `GuardianKey`
 * already answers with an empty state when the reader guards nothing, which is
 * also the honest answer to somebody who typed the URL.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function GuardianKeyPage() {
  return <GuardianKey />
}
