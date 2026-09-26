"use client"

import { CalendarClockIcon, LockKeyholeOpenIcon, PackageOpenIcon } from "lucide-react"

import { Paper } from "@/components/doc/paper"
import { DocTitle } from "@/components/doc/title"
import { useLocale } from "@/components/locale-provider"
import { fmtDate, fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { AssetRow } from "@/features/handover/components/asset-row"
import type { OpenedHandover as Opened } from "@/features/handover/lib/open-handover"
import { HANDOVER } from "@/features/handover/strings/handover"

/** Everything the owner handed over, already opened in this tab. */
export function OpenedHandover({ handover }: { handover: Opened }) {
  const locale = useLocale()
  const labels = t(HANDOVER, locale)

  return (
    <div className="flex flex-col gap-6">
      <DocTitle
        eyebrow={labels.itemCount.replace("{n}", fmtNumber(handover.items.length, locale))}
        eyebrowIcon={PackageOpenIcon}
        title={labels.openTitle}
        lead={labels.openBody}
      />

      <div className="bg-card/70 border-border text-foreground/75 rounded-row mt-2 flex flex-col gap-3 border p-4 text-[14px] leading-[1.75]">
        <p className="flex items-start gap-3">
          <LockKeyholeOpenIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" strokeWidth={2} aria-hidden />
          {labels.openThisPage}
        </p>
        <p className="flex items-start gap-3">
          <CalendarClockIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" strokeWidth={2} aria-hidden />
          {labels.closesOn.replace("{date}", fmtDate(new Date(handover.expiresAt), locale))}
        </p>
      </div>

      <Paper className="rise-in">
        <ul className="divide-border divide-y">
          {handover.items.map((item) => (
            <AssetRow key={item.assetId} item={item} />
          ))}
        </ul>
      </Paper>
    </div>
  )
}
