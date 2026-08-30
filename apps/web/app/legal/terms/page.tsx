import type { Metadata } from "next"

import { PageHeader } from "@/components/shell/page-header"
import { ProseSection } from "@/components/shell/prose-section"
import { SiteShell } from "@/components/shell/site-shell"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { LEGAL } from "@/lib/i18n/strings/legal"

export async function generateMetadata(): Promise<Metadata> {
  const labels = t(LEGAL, await getLocale())
  return { title: labels.termsMetaTitle }
}

export default async function Page() {
  const labels = t(LEGAL, await getLocale())

  return (
    <SiteShell width="prose">
      <PageHeader title={labels.termsTitle} lede={labels.termsLede} />
      <div className="mt-10 flex flex-col gap-7">
        <ProseSection title={labels.termsNotLegalTitle}>
          {labels.termsNotLegalBody}
        </ProseSection>
        <ProseSection title={labels.termsAvailabilityTitle}>
          {labels.termsAvailabilityBody}
        </ProseSection>
      </div>
    </SiteShell>
  )
}
