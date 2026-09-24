"use client"

import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { MESSAGE_KEY_ID } from "@workspace/crypto/message"
import { useQuery } from "convex/react"
import { CalendarClockIcon, PackageOpenIcon, TriangleAlertIcon } from "lucide-react"

import { Paper } from "@/components/doc/paper"
import { DocTitle } from "@/components/doc/title"
import { useLocale } from "@/components/locale-provider"
import { NoticeCard } from "@/components/notice-card"
import { Placeholder } from "@/components/placeholder"
import { fmtDate, fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { AssetRow, type BoxItem } from "@/features/box/components/asset-row"
import { HeirMessage } from "@/features/box/components/heir-message"
import { labelFor, type OpenedBundle } from "@/features/box/lib/open-box"
import { HEIR_BOX } from "@/features/box/strings/heir-box"

/**
 * What was actually left to this heir.
 *
 * The bundle carries keys and nothing else — `assetId → DEK` — so this joins
 * it to `release.assetsForDelivery`: the server's list of ciphertext, the
 * heir's map of keys, and `openLabel` in between. That query hands over no key
 * material, so it may re-run freely.
 *
 * Rows the bundle has a key for come first. A row it cannot name is not an
 * error the reader can act on, and should not be the first thing they see.
 */
export function OpenedBox({
  deliveryId,
  bundle,
  expiresAt,
}: {
  deliveryId: Id<"deliveries">
  bundle: OpenedBundle
  expiresAt: number
}) {
  const locale = useLocale()
  const labels = t(HEIR_BOX, locale)
  const common = t(COMMON, locale)
  const contents = useQuery(api.release.assetsForDelivery, { deliveryId })

  if (contents === undefined) return <Placeholder label={common.loading} className="h-72" />
  // The preconditions are re-asserted inside the query, so `null` here means
  // the delivery stopped qualifying between opening the bundle and asking for
  // the list — it expired, or the session changed hands.
  if (contents === null) {
    return <NoticeCard icon={TriangleAlertIcon} tone="attention" title={labels.gateTitle} body={labels.failed} />
  }

  const items: BoxItem[] = contents.items.map((item) => {
    const dek = bundle.deks[item.assetId]
    const label = labelFor(item.labelSealed, dek)
    return {
      assetId: item.assetId,
      type: item.type,
      title: label?.title ?? null,
      subtitle: label?.subtitle,
      byteSize: item.meta.byteSize,
      mimeType: item.meta.mimeType,
      via: item.via,
      contentUrls: item.contentUrls,
      hasInstructions: item.instructionsCiphertext !== null,
      dek,
    }
  })
  items.sort((a, b) => Number(a.title === null) - Number(b.title === null))

  return (
    <div className="flex flex-col gap-6">
      <DocTitle eyebrow={labels.itemCount.replace("{n}", fmtNumber(items.length, locale))} eyebrowIcon={PackageOpenIcon} title={labels.openTitle} lead={labels.openBody} />

      <p className="bg-card/70 border-border text-foreground/75 rounded-row mt-2 flex items-start gap-3 border p-4 text-[14px] leading-[1.75]">
        <CalendarClockIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" strokeWidth={2} aria-hidden />
        {labels.closesOn.replace("{date}", fmtDate(new Date(expiresAt), locale))}
      </p>

      {/* A personal message is not an asset — it has its own key map and no
          `assetRecipients` row — so it gets its own card rather than a row that
          would need every column to be optional. */}
      {contents.messageUrl !== null && bundle.messageKeys[MESSAGE_KEY_ID] !== undefined && (
        <HeirMessage url={contents.messageUrl} messageKey={bundle.messageKeys[MESSAGE_KEY_ID]} />
      )}

      <Paper className="rise-in">
        <ul className="divide-border divide-y">
          {items.map((item) => (
            <AssetRow key={item.assetId} item={item} />
          ))}
        </ul>
      </Paper>
    </div>
  )
}
