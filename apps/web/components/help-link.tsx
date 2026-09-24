import Link from "next/link"
import { ArrowLeftIcon, LifeBuoyIcon } from "lucide-react"

import { IconDisc } from "@/components/icon-disc"
import { t, type Locale } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * The way to a person, at the foot of a case or a delivery. It carries the
 * case's id so the support thread starts with its context attached.
 */
export function HelpLink({
  locale,
  topic,
  claimId,
  deliveryId,
}: {
  locale: Locale
  topic: "claim" | "delivery"
  claimId?: string
  deliveryId?: string
}) {
  const params = new URLSearchParams({ topic })
  if (claimId !== undefined) params.set("claim", claimId)
  if (deliveryId !== undefined) params.set("delivery", deliveryId)
  const labels = t(COMMON, locale)

  return (
    <Link
      href={`/help/chat?${params.toString()}`}
      className="group border-border bg-card/60 hover:bg-card rounded-card mt-10 flex items-center gap-4 border p-5 transition-colors"
    >
      <IconDisc icon={LifeBuoyIcon} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="font-heading block text-[16px] font-bold">{labels.needHelp}</span>
        <span className="text-muted-foreground mt-0.5 block text-[13.5px]">{labels.needHelpBody}</span>
      </span>
      <ArrowLeftIcon aria-hidden className="nudge text-muted-foreground size-5 shrink-0 ltr:rotate-180" strokeWidth={2.2} />
    </Link>
  )
}
