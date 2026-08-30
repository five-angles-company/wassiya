import type { Metadata } from "next"
import Link from "next/link"

import { PageHeader } from "@/components/shell/page-header"
import { ProseSection } from "@/components/shell/prose-section"
import { SiteShell } from "@/components/shell/site-shell"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { CLAIM_SUPPORT } from "@/lib/i18n/strings/claim-support"

export async function generateMetadata(): Promise<Metadata> {
  const labels = t(CLAIM_SUPPORT, await getLocale())
  return { title: labels.resumeMetaTitle, robots: { index: false, follow: false } }
}

/**
 * `/claim/resume` — and deliberately **not** a claim-number lookup.
 *
 * The obvious design is a box that takes `C-4482` and opens the claim. It
 * cannot exist. `shortRef` in `lib/claim-ref.ts` is a lossy `% 10_000` hash
 * whose own header states it is *"not a secret and not a lookup key"* and that
 * two claims may collide with no consequence. The full id in the URL is the
 * capability; resolving a claim by its short number would either fail or hand
 * someone else's claim to whoever guessed four digits.
 *
 * So the page says that out loud and helps with the real problem, which is
 * finding an email.
 */
export default async function Page() {
  const labels = t(CLAIM_SUPPORT, await getLocale())

  return (
    <SiteShell width="prose">
      <PageHeader title={labels.resumeTitle} lede={labels.resumeLede} />
      <div className="mt-10 flex flex-col gap-7">
        <ProseSection title={labels.resumeFindTitle}>
          {labels.resumeFindBody}
        </ProseSection>
        <ProseSection title={labels.resumeWhyTitle}>
          {labels.resumeWhyBody}
        </ProseSection>
      </div>
      <Link
        href="/claim/contact"
        className="bg-primary text-primary-foreground hover:bg-terracotta-600 mt-8 inline-flex rounded-full px-6 py-3 text-[15px] font-semibold transition-colors"
      >
        {labels.resumeStuck}
      </Link>
    </SiteShell>
  )
}
