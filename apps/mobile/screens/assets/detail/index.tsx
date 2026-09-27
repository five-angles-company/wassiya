/**
 * ٤.٩ — one asset. Every type renders the same page from its own section
 * cards (`sections-for.ts`); editing opens one step at a time on
 * `/assets/[id]/edit`.
 */
import type { Id } from "@workspace/backend/dataModel"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { useLocalSearchParams } from "expo-router"

import { useStrings } from "@/i18n/use-strings"
import { ASSET_TYPE_ICON, type AssetType } from "@/lib/asset-types"
import { AssetOverviewFrame } from "@/screens/assets/detail/overview-frame"
import { sectionsFor, type TypeLabels } from "@/screens/assets/detail/sections-for"
import { useAssetEditor } from "@/screens/assets/detail/use-asset-editor"

export function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const assetId = id as Id<"assets">
  const { locale } = useStrings("assets/detail")
  const { t: chrome } = useStrings("assets/new")
  const { t: types } = useStrings("assets/new-sheet")
  const labels: TypeLabels = {
    crypto: useStrings("assets/new/crypto").t,
    bank: useStrings("assets/new/bank").t,
    digital: useStrings("assets/new/account").t,
    document: useStrings("assets/new/document").t,
    photos: useStrings("assets/new/photos").t,
    note: useStrings("assets/new/note").t,
    investment: useStrings("assets/new/investment").t,
    insurance: useStrings("assets/new/insurance").t,
  }
  const { asset, load } = useAssetEditor(assetId)

  const formatSize = (bytes: number) =>
    `${fmtNum(Math.round((bytes / 1024 / 1024) * 10) / 10, locale)} ${locale === "ar" ? "م.ب" : "MB"}`

  const type: AssetType = asset?.type ?? "note"
  const sections =
    asset !== undefined && load.status === "ready"
      ? sectionsFor(asset.type, load, labels, locale, formatSize, chrome.notRecorded!)
      : null

  return (
    <AssetOverviewFrame
      assetId={assetId}
      load={load}
      icon={ASSET_TYPE_ICON[type]}
      kindLine={types[`${type}Name`]!}
      sections={sections}
      handedOver={asset?.handedOver ?? false}
    />
  )
}
