import type { Metadata } from "next"

import { IdentityFlow } from "@/components/claim/identity-flow"
import { CLAIM_IDENTITY } from "@/lib/claim-copy"

/**
 * ٧.٢ — `/claim/identity`. Step 1 of 3.
 *
 * Two things happen here, and the board only draws the second: the claim is
 * **filed**, and then the claimant is **verified**. Filing needs the deceased's
 * email — that is how `claims.submit` finds the vault — and the board's flow
 * never shows it being collected, because the design assumes the claim already
 * exists by this screen. It has to be asked somewhere, and "من أنت؟" is the
 * screen where both parties are identified, so it is asked here.
 *
 * Sign-in is required before either step, which is a departure from 7.1's
 * "nothing to install, nothing to remember" only in appearance: `claims.submit`
 * needs an account so the rate limit and the 90-day veto lockout attach to a
 * person rather than to a typed-in string, and identity verification is
 * mandatory for heirs at claim time regardless. The *status* page (7.4) stays
 * account-free, which is where the promise actually matters — that is the page
 * they re-open for weeks.
 */
/**
 * Never prerendered: every one of these screens reads per-user Convex state,
 * so a build-time snapshot could only ever be wrong. Marking it explicitly also
 * keeps the production build from depending on runtime env vars being present
 * at build time, which is what a static pass would force.
 */
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: CLAIM_IDENTITY.metaTitle,
  robots: { index: false, follow: false },
}

export default function ClaimIdentityPage() {
  return <IdentityFlow />
}
