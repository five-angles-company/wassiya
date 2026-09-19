"use client"

import type { ReactNode } from "react"
import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"

import { Ask } from "@/components/doc/ask"
import { Prose } from "@/components/doc/prose"
import { StatusLine } from "@/components/doc/status-line"
import { DocTitle } from "@/components/doc/title"
import { useLocale } from "@/components/locale-provider"
import { RecordNotFound } from "@/components/record-not-found"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { HeirBox } from "@/features/box/components/heir-box"
import { DELIVERY } from "@/features/box/strings/delivery"

/**
 * One delivery, from the heir's side: the identity step, the wait for staff
 * when the ID number could not decide it, and then the box.
 *
 * The identity step arrives as a slot: it is `features/claims`' panel, and a
 * feature may not import another — the route composes them.
 */
export function HeirDelivery({
  deliveryId,
  identity,
}: {
  deliveryId: string
  identity: ReactNode
}) {
  const locale = useLocale()
  const labels = t(DELIVERY, locale)
  const common = t(COMMON, locale)
  const delivery = useQuery(api.deliveries.forHeir, { deliveryId })

  if (delivery === undefined) {
    return <div className="border-border h-40 animate-pulse border-y" aria-hidden />
  }
  if (delivery === null) {
    return <RecordNotFound id={deliveryId} backHref="/" backLabel={labels.back} />
  }

  if (delivery.status === "ready") {
    return <HeirBox deliveryId={delivery.deliveryId} expiresAt={delivery.expiresAt} />
  }

  if (delivery.status === "expired" || delivery.status === "rejected") {
    const expired = delivery.status === "expired"
    return (
      <article className="flex flex-col gap-4">
        <DocTitle title={expired ? labels.expiredTitle : labels.rejectedTitle} />
        <Prose>
          <p>{expired ? labels.expiredBody : labels.rejectedBody}</p>
        </Prose>
      </article>
    )
  }

  if (delivery.identityStatus !== "verified") {
    return (
      <article className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <DocTitle title={labels.identityTitle} />
          <Prose>
            <p>{labels.identityBody}</p>
          </Prose>
        </div>
        <Ask eyebrow={common.askEyebrow} title={labels.identityTitle}>
          {identity}
        </Ask>
      </article>
    )
  }

  return (
    <article className="flex flex-col gap-4">
      <DocTitle title={labels.checkingTitle} />
      <StatusLine tone="settled">{labels.checkingBody}</StatusLine>
    </article>
  )
}
