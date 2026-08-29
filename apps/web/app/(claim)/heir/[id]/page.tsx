import type { Metadata } from "next"
import { cookies } from "next/headers"

import { HeirBox } from "@/components/claim/heir-box"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"
import { HEIR_BOX } from "@/lib/i18n/strings/heir-box"

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

/** Async because the title follows the reader's locale, like every string. */
export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  return {
    title: t(HEIR_BOX, locale).metaTitle,
    robots: { index: false, follow: false },
  }
}

export default async function HeirBoxPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <HeirBox claimId={id} />
}
