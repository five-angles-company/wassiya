"use client"

import {
  BanknoteIcon,
  CoinsIcon,
  FileTextIcon,
  ImagesIcon,
  MonitorSmartphoneIcon,
  ShieldCheckIcon,
  StickyNoteIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react"

import { IconDisc } from "@/components/icon-disc"
import { useLocale } from "@/components/locale-provider"
import { fmtBytes } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { AssetDownloads } from "@/features/handover/components/asset-downloads"
import { AssetField } from "@/features/handover/components/asset-field"
import type { OpenedItem } from "@/features/handover/lib/open-handover"
import { ASSET_LABELS } from "@/features/handover/strings/asset-labels"

const ICON: Record<string, LucideIcon> = {
  crypto: CoinsIcon,
  bank: BanknoteIcon,
  document: FileTextIcon,
  photos: ImagesIcon,
  digital: MonitorSmartphoneIcon,
  note: StickyNoteIcon,
  investment: TrendingUpIcon,
  insurance: ShieldCheckIcon,
}

const TYPE_LABEL: Record<string, keyof typeof ASSET_LABELS> = {
  crypto: "typeCrypto",
  bank: "typeBank",
  document: "typeDocument",
  photos: "typePhotos",
  digital: "typeDigital",
  note: "typeNote",
  investment: "typeInvestment",
  insurance: "typeInsurance",
}

/**
 * One handed-over item. The secret fields are shown as text — a seed phrase or
 * a password is read, not downloaded — and each file is its own download.
 */
export function AssetRow({ item }: { item: OpenedItem }) {
  const locale = useLocale()
  const labels = t(ASSET_LABELS, locale)

  const Icon = ICON[item.type] ?? FileTextIcon
  const typeKey = TYPE_LABEL[item.type]
  const typeName = typeKey === undefined ? item.type : labels[typeKey]
  const dek = item.dek

  return (
    <li className="flex flex-col gap-4 px-5 py-5 md:px-6">
      <div className="flex items-start gap-4">
        <IconDisc icon={Icon} tone={item.title === null ? "attention" : "quiet"} />
        <div className="min-w-0 flex-1">
          <div className="font-heading text-[17px] font-extrabold [overflow-wrap:anywhere]">
            {item.title ?? labels.noKeyTitle}
          </div>
          <p className="text-muted-foreground mt-1 text-[14px] leading-[1.6]">
            {item.title === null
              ? labels.noKeyBody
              : [item.subtitle, typeName, item.byteSize === undefined ? undefined : fmtBytes(item.byteSize, locale)]
                  .filter((part) => part !== undefined && part.length > 0)
                  .join(" · ")}
          </p>
          {item.title === null && (
            <p dir="ltr" className="text-muted-foreground mt-2 font-mono text-[11.5px]">
              {item.assetId}
            </p>
          )}
        </div>
      </div>

      {item.fields.length > 0 && (
        <dl className="bg-card/70 border-border rounded-row grid gap-4 border p-4">
          {item.fields.map((field) => (
            <AssetField key={field.key} field={field} />
          ))}
        </dl>
      )}

      {dek !== undefined && item.files.length > 0 && <AssetDownloads item={{ ...item, dek }} typeName={typeName} />}
    </li>
  )
}
