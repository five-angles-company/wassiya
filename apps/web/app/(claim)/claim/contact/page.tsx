import type { Metadata } from "next"

import { ContactForm } from "@/components/claim/contact-form"
import { PageHeader } from "@/components/shell/page-header"
import { SiteShell } from "@/components/shell/site-shell"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { CLAIM_SUPPORT } from "@/lib/i18n/strings/claim-support"

export async function generateMetadata(): Promise<Metadata> {
  const labels = t(CLAIM_SUPPORT, await getLocale())
  return { title: labels.contactMetaTitle, robots: { index: false, follow: false } }
}

/**
 * Support, with the claim reference carried in from wherever they came.
 *
 * `?ref=C-4482` is read on the server and pre-fills the field, so someone
 * arriving from a status page does not have to go back for a number they were
 * just looking at.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const labels = t(CLAIM_SUPPORT, await getLocale())
  const { ref } = await searchParams

  return (
    <SiteShell width="prose">
      <PageHeader title={labels.contactTitle} lede={labels.contactLede} />
      <ContactForm defaultRef={ref ?? ""} />
    </SiteShell>
  )
}
