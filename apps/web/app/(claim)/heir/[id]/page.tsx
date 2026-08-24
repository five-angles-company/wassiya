import type { Metadata } from "next"

import { HeirBox } from "@/components/claim/heir-box"
import { HEIR_BOX } from "@/lib/claim-copy"

/**
 * ٧.٦ — `/heir/:id`. The endpoint of the whole product.
 *
 * Unlike 7.4, this one needs an account: `release.releasedBundleForHeir`
 * checks `claim.claimantUserId === claimant._id` before handing over the
 * withheld half of K_h, and it is a mutation rather than a query precisely so
 * that hand-over is audited every time.
 *
 * The board's own closing note is worth keeping in view here: *"after 90 days
 * the box goes read-only and then closes — this is an endpoint, not a
 * product."*
 */
/**
 * Never prerendered: every one of these screens reads per-user Convex state,
 * so a build-time snapshot could only ever be wrong. Marking it explicitly also
 * keeps the production build from depending on runtime env vars being present
 * at build time, which is what a static pass would force.
 */
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: HEIR_BOX.metaTitle,
  robots: { index: false, follow: false },
}

export default async function HeirBoxPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <HeirBox claimId={id} />
}
