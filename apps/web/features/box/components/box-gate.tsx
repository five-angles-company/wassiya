"use client"

import { ArrowRightIcon, CalendarClockIcon, GiftIcon, MonitorSmartphoneIcon } from "lucide-react"

import { Button } from "@/components/button"
import { DocTitle } from "@/components/doc/title"
import { IconDisc } from "@/components/icon-disc"
import { useLocale } from "@/components/locale-provider"
import { fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { HEIR_BOX } from "@/features/box/strings/heir-box"

/**
 * The step in front of the box. It asks for nothing — identity was confirmed
 * before the delivery became ready — so opening is one action. It states the
 * two facts worth knowing first: the contents appear on this device, and the
 * delivery closes on a date.
 */
export function BoxGate({
  expiresAt,
  busy,
  error,
  onUnlock,
}: {
  expiresAt: number
  busy: boolean
  error?: string
  onUnlock: () => void
}) {
  const locale = useLocale()
  const labels = t(HEIR_BOX, locale)

  return (
    <article className="flex flex-col gap-6">
      <DocTitle eyebrow={labels.gateEyebrow} eyebrowIcon={GiftIcon} title={labels.gateTitle} lead={labels.gateBody} />

      <section className="rise-in bg-card border-border rounded-panel relative mt-4 overflow-hidden border p-7 shadow-[var(--shadow-overlay)] md:p-9">
        <span aria-hidden className="bg-brand absolute inset-x-0 top-0 h-1" />
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <IconDisc icon={GiftIcon} tone="brand" size="lg" shape="circle" />
          <div className="flex flex-1 flex-col items-start gap-3">
            <Button size="lg" onClick={onUnlock} disabled={busy}>
              {busy ? labels.unlocking : labels.unlock}
              <ArrowRightIcon className="size-5 rtl:-scale-x-100" strokeWidth={2.75} aria-hidden />
            </Button>
            <span className="text-muted-foreground inline-flex items-center gap-2 text-[13.5px]">
              <MonitorSmartphoneIcon className="size-4" strokeWidth={2.25} aria-hidden />
              {labels.onDevice}
            </span>
          </div>
        </div>
        {error !== undefined && (
          <p className="text-tone-attention mt-5 max-w-[62ch] text-[14.5px] leading-[1.7] font-semibold">{error}</p>
        )}
        <p className="bg-background/70 text-foreground/75 rounded-row mt-6 flex items-start gap-3 p-4 text-[14px] leading-[1.75]">
          <CalendarClockIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" strokeWidth={2} aria-hidden />
          {labels.closesOn.replace("{date}", fmtDate(new Date(expiresAt), locale))}
        </p>
      </section>
    </article>
  )
}
