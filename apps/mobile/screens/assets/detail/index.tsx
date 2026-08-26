/**
 * ٤.٩ — one asset.
 *
 * A dispatcher, and deliberately nothing else. The type decides which screen an
 * asset opens into, and that decision has to happen before either child runs a
 * hook — which is the whole reason this file holds no state of its own.
 *
 * `digital` opens its **edit form** (`edit-screen.tsx`): tapping an asset opens
 * the thing that changes it, with no read-only page in between. The other five
 * types still open the read view (`read-screen.tsx`) until their forms land —
 * each needs work the digital account did not (IBAN validation, a legacy phrase
 * payload that stores neither its network nor its kind, a note draft store that
 * must not be prefilled with plaintext, two file pickers), and handing them a
 * form that cannot save them would be worse than the page they have.
 */
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Text } from "@workspace/ui-native/components/ui/text"
import { useLocalSearchParams } from "expo-router"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import { AssetEditScreen } from "@/screens/assets/detail/edit-screen"
import { AssetReadScreen } from "@/screens/assets/detail/read-screen"

/** Types whose edit form exists. The rest is the migration order. */
const EDITABLE = ["digital"]

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

  return EDITABLE.includes(asset.type) ? (
    <AssetEditScreen assetId={assetId} />
  ) : (
    <AssetReadScreen assetId={assetId} />
  )
}
