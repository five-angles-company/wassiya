import type { Metadata } from "next"

import { PageHeader } from "@/components/shell/page-header"
import { ProseSection } from "@/components/shell/prose-section"
import { SiteShell } from "@/components/shell/site-shell"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { LEGAL } from "@/lib/i18n/strings/legal"

export async function generateMetadata(): Promise<Metadata> {
  const labels = t(LEGAL, await getLocale())
  return { title: labels.encryptionMetaTitle, description: labels.encryptionLede }
}

/**
 * The page the top bar links to as الأمان.
 *
 * Not filed with the other two under "legal" in the reader's mind, even though
 * it shares their URL prefix: terms and privacy are things you agree to, and
 * this is the reason you would. It ends by stating what we *can* see, because a
 * page that listed only guarantees would be an advertisement.
 */
export default async function Page() {
  const labels = t(LEGAL, await getLocale())

  return (
    <SiteShell width="prose">
      <PageHeader title={labels.encryptionTitle} lede={labels.encryptionLede} />
      <div className="mt-10 flex flex-col gap-7">
        <ProseSection title={labels.keyTitle}>{labels.keyBody}</ProseSection>
        <ProseSection title={labels.assetTitle}>{labels.assetBody}</ProseSection>
        <ProseSection title={labels.halvesTitle}>
          {labels.halvesBody}
        </ProseSection>
        <ProseSection title={labels.limitsTitle}>
          {labels.limitsBody}
        </ProseSection>
        <ProseSection title={labels.canTitle}>{labels.canBody}</ProseSection>
      </div>
    </SiteShell>
  )
}
