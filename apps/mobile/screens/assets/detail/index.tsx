/**
 * ٤.٩ — one asset.
 *
 * A dispatcher, and deliberately nothing else. The type decides which screen an
 * asset opens into, and that decision has to happen before either child runs a
 * hook — which is the whole reason this file holds no state of its own.
 *
 * Every type opens its **edit form**: tapping an asset opens the thing that
 * changes it, with no read-only page in between. The switch is exhaustive over
 * `AssetType`, so adding a seventh type is a compile error here rather than a
 * screen that silently falls through to someone else's fields.
 */
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Text } from "@workspace/ui-native/components/ui/text"
import { useLocalSearchParams } from "expo-router"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import { BankEditScreen } from "@/screens/assets/detail/edit/bank"
import { CryptoEditScreen } from "@/screens/assets/detail/edit/crypto"
import { DigitalEditScreen } from "@/screens/assets/detail/edit/digital"
import { DocumentEditScreen } from "@/screens/assets/detail/edit/document"
import { NoteEditScreen } from "@/screens/assets/detail/edit/note"
import { PhotosEditScreen } from "@/screens/assets/detail/edit/photos"

export function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const assetId = id as Id<"assets">
  const { t: common } = useStrings("common")
  const asset = useQuery(api.assets.get, { assetId })

  if (asset === undefined) {
    return (
      <Screen scroll={false}>
        <BackButton label={common.back} fallbackHref="/assets" />
        <Text variant="meta" className="mt-6">
          {common.loading}
        </Text>
      </Screen>
    )
  }

  switch (asset.type) {
    case "digital":
      return <DigitalEditScreen assetId={assetId} />
    case "bank":
      return <BankEditScreen assetId={assetId} />
    case "crypto":
      return <CryptoEditScreen assetId={assetId} />
    case "note":
      return <NoteEditScreen assetId={assetId} />
    case "document":
      return <DocumentEditScreen assetId={assetId} />
    case "photos":
      return <PhotosEditScreen assetId={assetId} />
  }
}
