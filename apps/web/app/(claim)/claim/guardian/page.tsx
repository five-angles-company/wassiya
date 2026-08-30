import type { Metadata } from "next"

import { PageHeader } from "@/components/shell/page-header"
import { ProseSection } from "@/components/shell/prose-section"
import { SiteShell } from "@/components/shell/site-shell"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { CLAIM_SUPPORT } from "@/lib/i18n/strings/claim-support"

export async function generateMetadata(): Promise<Metadata> {
  const labels = t(CLAIM_SUPPORT, await getLocale())
  return { title: labels.guardianMetaTitle, description: labels.guardianLede }
}

/**
 * The guardian's front door.
 *
 * A guardian is the only actor in this product who is asked for something years
 * after agreeing to it, gains nothing, and is usually not technical. This page
 * exists so that the invitation they receive lands somewhere that explains
 * itself, rather than on a sign-in box.
 *
 * It says plainly that they are **not** part of recovery — the guardian was
 * removed from that path deliberately, and a guardian who believes they are a
 * backup for a living owner has been misled about what they hold.
 *
 * The last section is honest about the screens not existing yet. When they do,
 * it becomes the sign-in door to `/guardian`.
 */
export default async function Page() {
  const labels = t(CLAIM_SUPPORT, await getLocale())

  return (
    <SiteShell width="prose">
      <PageHeader title={labels.guardianTitle} lede={labels.guardianLede} />
      <div className="mt-10 flex flex-col gap-7">
        <ProseSection title={labels.guardianWhatTitle}>
          {labels.guardianWhatBody}
        </ProseSection>
        <ProseSection title={labels.guardianWhenTitle}>
          {labels.guardianWhenBody}
        </ProseSection>
        <ProseSection title={labels.guardianNotTitle}>
          {labels.guardianNotBody}
        </ProseSection>
      </div>

      <div className="bg-card rounded-card shadow-raised mt-10 p-6">
        <h2 className="text-[17px]">{labels.guardianSoonTitle}</h2>
        <p className="text-sand-700 mt-2.5 text-[15px] leading-[1.75]">
          {labels.guardianSoonBody}
        </p>
      </div>
    </SiteShell>
  )
}
