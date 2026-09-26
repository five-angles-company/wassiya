"use client"

import { CalendarClockIcon, PackageOpenIcon } from "lucide-react"

import { Paper } from "@/components/doc/paper"
import { DocTitle } from "@/components/doc/title"
import { useLocale } from "@/components/locale-provider"
import { fmtDate, fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { AssetRow } from "@/features/box/components/asset-row"
import { HeirMessage } from "@/features/box/components/heir-message"
import type { OpenedDelivery } from "@/features/box/lib/open-box"
import { HEIR_BOX } from "@/features/box/strings/heir-box"

/** What was actually left to this heir, already opened in this tab. */
export function OpenedBox({ delivery }: { delivery: OpenedDelivery }) {
  const locale = useLocale()
  const labels = t(HEIR_BOX, locale)

  return (
    <div className="flex flex-col gap-6">
      <DocTitle eyebrow={labels.itemCount.replace("{n}", fmtNumber(delivery.items.length, locale))} eyebrowIcon={PackageOpenIcon} title={labels.openTitle} lead={labels.openBody} />

      <p className="bg-card/70 border-border text-foreground/75 rounded-row mt-2 flex items-start gap-3 border p-4 text-[14px] leading-[1.75]">
        <CalendarClockIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" strokeWidth={2} aria-hidden />
        {labels.closesOn.replace("{date}", fmtDate(new Date(delivery.expiresAt), locale))}
      </p>

      {/* A personal message is not an asset, so it gets its own card rather
          than a row that would need every column to be optional. */}
      {delivery.message !== null && (
        <HeirMessage url={delivery.message.url} messageKey={delivery.message.key} />
      )}

      <Paper className="rise-in">
        <ul className="divide-border divide-y">
          {delivery.items.map((item) => (
            <AssetRow key={item.assetId} item={item} />
          ))}
        </ul>
      </Paper>
    </div>
  )
}
