import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeftIcon, ShieldCheckIcon, SmartphoneIcon } from "lucide-react"

import { PageHeader } from "@/components/shell/page-header"
import { SiteShell } from "@/components/shell/site-shell"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { HOME } from "@/lib/i18n/strings/common"

export async function generateMetadata(): Promise<Metadata> {
  const labels = t(HOME, await getLocale())
  return { title: labels.metaTitle, description: labels.metaDescription }
}

/**
 * `/` — the two questions anyone arriving at the bare domain is here to ask.
 *
 * **An owner is told to leave, and that is the answer rather than a gap.**
 * Owners are mobile-only on purpose: MK, the biometric gate, the veto and the
 * check-in all need a hardware keystore a browser does not have. The header
 * links here as "my account", so this page owes that person something true
 * instead of a sign-in box that would strand them.
 *
 * The two paths are drawn as equals. A guardian arriving from an emailed
 * invitation is not a lesser visitor than a bereaved relative, and burying
 * their route under the claim CTA is how the guardian surface ended up with no
 * front door at all.
 */
export default async function Page() {
  const locale = await getLocale()
  const labels = t(HOME, locale)

  return (
    <SiteShell>
      <PageHeader title={labels.title} lede={labels.metaDescription} />

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/claim"
          className="bg-card rounded-card shadow-raised hover:shadow-overlay group flex flex-col gap-3 p-6 transition-shadow"
        >
          <h2 className="text-[19px]">{labels.claimTitle}</h2>
          <p className="text-sand-700 text-[14.5px] leading-[1.7]">
            {labels.claimBody}
          </p>
          <span className="text-terracotta-700 mt-1 inline-flex items-center gap-1.5 text-[14.5px] font-semibold">
            {labels.claimAction}
            {/* Points along the reading direction: leftward in Arabic, and
                flipped for English. */}
            <ArrowLeftIcon
              className="size-4 transition-transform group-hover:-translate-x-0.5 ltr:rotate-180 ltr:group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </Link>

        <Link
          href="/claim/guardian"
          className="border-border hover:bg-card rounded-card group flex flex-col gap-3 border p-6 transition-colors"
        >
          <h2 className="text-[19px]">{labels.guardianTitle}</h2>
          <p className="text-sand-700 text-[14.5px] leading-[1.7]">
            {labels.guardianBody}
          </p>
          <span className="text-terracotta-700 mt-1 inline-flex items-center gap-1.5 text-[14.5px] font-semibold">
            {labels.guardianAction}
            <ArrowLeftIcon
              className="size-4 transition-transform group-hover:-translate-x-0.5 ltr:rotate-180 ltr:group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </Link>
      </div>

      <div className="border-border mt-12 grid gap-6 border-t pt-8 sm:grid-cols-2">
        <div className="flex gap-3">
          <SmartphoneIcon
            className="text-sand-600 mt-0.5 size-5 shrink-0"
            aria-hidden
          />
          <div>
            <h3 className="text-[15px] font-semibold">{labels.ownerTitle}</h3>
            <p className="text-sand-700 mt-1 text-[14px] leading-[1.7]">
              {labels.ownerBody}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <ShieldCheckIcon
            className="text-sand-600 mt-0.5 size-5 shrink-0"
            aria-hidden
          />
          <div>
            <h3 className="text-[15px] font-semibold">{labels.sealedTitle}</h3>
            <p className="text-sand-700 mt-1 text-[14px] leading-[1.7]">
              {labels.sealedBody}
            </p>
            <Link
              href="/legal/encryption"
              className="text-terracotta-700 mt-2 inline-block text-[14px] hover:underline"
            >
              {labels.sealedMore}
            </Link>
          </div>
        </div>
      </div>
    </SiteShell>
  )
}
