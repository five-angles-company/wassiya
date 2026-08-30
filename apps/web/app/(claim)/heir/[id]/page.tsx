import type { Metadata } from "next"
import { cookies } from "next/headers"

import { HeirBox } from "@/components/claim/heir-box"
import { StatusShell } from "@/components/claim/status-shell"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"
import { HEIR_BOX } from "@/lib/i18n/strings/heir-box"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  return {
    title: t(HEIR_BOX, locale).metaTitle,
    robots: { index: false, follow: false },
  }
}

/**
 * ٧.٦ — `/heir/:id`. The endpoint of the whole product.
 *
 * Needs an account, unlike the status page: `release.releasedBundleForHeir`
 * checks `claim.claimantUserId === claimant._id` before handing over the
 * withheld half of K_h, and it is a mutation rather than a query precisely so
 * that hand-over is audited every time.
 *
 * *"After 90 days the box goes read-only and then closes — this is an endpoint,
 * not a product."*
 */
export default async function HeirBoxPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)

  return (
    <StatusShell locale={locale}>
      <HeirBox claimId={id} />
    </StatusShell>
  )
}
