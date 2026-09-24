"use client"

import type { ReactNode } from "react"
import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"
import { ArchiveXIcon, ShieldQuestionIcon, UserCheckIcon, UserSearchIcon } from "lucide-react"

import { Ask } from "@/components/doc/ask"
import { StatusBanner } from "@/components/doc/status-banner"
import { DocTitle } from "@/components/doc/title"
import { useLocale } from "@/components/locale-provider"
import { NoticeCard } from "@/components/notice-card"
import { Placeholder } from "@/components/placeholder"
import { RecordNotFound } from "@/components/record-not-found"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { HeirBox } from "@/features/box/components/heir-box"
import { DELIVERY } from "@/features/box/strings/delivery"

/**
 * One delivery, for the heir it is bound to. Every state says what happens
 * next and whether anything is needed from them.
 *
 * `identity` is passed in as a slot because the identity check belongs to the
 * claims feature, and one feature does not import another.
 */
export function HeirDelivery({ deliveryId, identity }: { deliveryId: string; identity: ReactNode }) {
  const locale = useLocale()
  const labels = t(DELIVERY, locale)
  const common = t(COMMON, locale)
  const delivery = useQuery(api.deliveries.forHeir, { deliveryId })

  if (delivery === undefined) return <Placeholder label={common.loading} className="h-72" />
  if (delivery === null) return <RecordNotFound id={deliveryId} backHref="/" backLabel={labels.back} />

  if (delivery.status === "ready") {
    return <HeirBox deliveryId={delivery.deliveryId} expiresAt={delivery.expiresAt} />
  }

  if (delivery.status === "expired" || delivery.status === "rejected") {
    const expired = delivery.status === "expired"
    return (
      <NoticeCard
        icon={expired ? ArchiveXIcon : ShieldQuestionIcon}
        tone={expired ? "quiet" : "attention"}
        title={expired ? labels.expiredTitle : labels.rejectedTitle}
        body={expired ? labels.expiredBody : labels.rejectedBody}
        headingLevel="h1"
      />
    )
  }

  if (delivery.identityStatus !== "verified") {
    return (
      <article className="flex flex-col gap-6">
        <DocTitle title={labels.identityTitle} lead={labels.identityBody} />
        <div className="mt-4">
          <Ask eyebrow={common.askEyebrow} title={labels.identityTitle} icon={UserCheckIcon}>
            {identity}
          </Ask>
        </div>
      </article>
    )
  }

  return (
    <article className="flex flex-col gap-6">
      <DocTitle title={labels.checkingTitle} />
      <StatusBanner tone="settled" icon={UserSearchIcon} headline={labels.checkingTitle}>
        <p>{labels.checkingBody}</p>
      </StatusBanner>
    </article>
  )
}
