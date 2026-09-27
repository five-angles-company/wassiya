import type { AssetTypeOption } from "@workspace/ui-native/components/wassiya/asset-type-grid"

import { useStrings } from "@/i18n/use-strings"
import { ASSET_TYPES, ASSET_TYPE_ICON, type AssetType } from "@/lib/asset-types"

/**
 * The types as tiles, for the add sheet and the empty vault — one table of
 * names and examples (`{type}Name`, `{type}Examples`), so the two can never
 * describe a type differently.
 */
export function useAssetTypeOptions(
  onSelect: (type: AssetType, label: string) => void
): AssetTypeOption[] {
  const { t } = useStrings("assets/new-sheet")
  return ASSET_TYPES.map((type) => ({
    id: type,
    icon: ASSET_TYPE_ICON[type],
    title: t[`${type}Name`]!,
    description: t[`${type}Examples`]!,
    onPress: () => onSelect(type, t[`${type}Name`]!),
  }))
}
