import type { AssetTypeOption } from "@workspace/ui-native/components/wassiya/asset-type-grid"

import { useStrings } from "@/i18n/use-strings"
import { ASSET_TYPES, ASSET_TYPE_ICON, type AssetType } from "@/lib/asset-types"

/**
 * The six asset types as tiles, for the add sheet and the empty vault — one
 * table of names and examples, so the two can never describe a type
 * differently.
 */
export function useAssetTypeOptions(
  onSelect: (type: AssetType, label: string) => void
): AssetTypeOption[] {
  const { t } = useStrings("assets/new-sheet")
  return ASSET_TYPES.map((type) => ({
    id: type,
    icon: ASSET_TYPE_ICON[type],
    title: t[NAME_KEY[type]]!,
    description: t[EXAMPLES_KEY[type]]!,
    onPress: () => onSelect(type, t[NAME_KEY[type]]!),
  }))
}

/** Keyed flat, so the strings table stays flat. */
const NAME_KEY = {
  crypto: "cryptoName",
  bank: "bankName",
  document: "documentName",
  photos: "photosName",
  digital: "digitalName",
  note: "noteName",
} as const satisfies Record<AssetType, string>

const EXAMPLES_KEY = {
  crypto: "cryptoExamples",
  bank: "bankExamples",
  document: "documentExamples",
  photos: "photosExamples",
  digital: "digitalExamples",
  note: "noteExamples",
} as const satisfies Record<AssetType, string>
