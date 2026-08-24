import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { AssetTypeGrid } from "@workspace/ui-native/components/wassiya/asset-type-grid"
import { Sheet } from "@workspace/ui-native/components/wassiya/sheet"
import type * as React from "react"

import { useStrings } from "@/i18n/use-strings"
import {
  ASSET_TYPES,
  ASSET_TYPE_ICON,
  ASSET_TYPE_TONE,
  type AssetType,
} from "@/lib/asset-types"

export type AssetTypeSheetProps = {
  ref?: React.Ref<TrueSheet>
  onSelect: (type: AssetType, label: string) => void
}

/**
 * ٤.٢ — "ما الذي تريد حفظه؟"
 *
 * A sheet rather than a route, which is the board's own instruction: "back
 * dismisses without losing the list scroll". A pushed screen would unwind 4.1's
 * scroll position on the way back, and that matters here because the tile you
 * want is often chosen after scrolling a long list.
 *
 * Six content-hugging tiles, so the sheet takes the default single `'auto'`
 * detent — no scroller, no fractional height. See `Sheet`'s sizing note for why
 * that pairing is the one that goes wrong.
 *
 * `onSelect` receives the type **and its localised name**, because every caller
 * so far needs the label for its own copy and re-deriving it from the type
 * means a second lookup table that can disagree with this one.
 */
export function AssetTypeSheet({ ref, onSelect }: AssetTypeSheetProps) {
  const { t } = useStrings("assets/new")

  return (
    <Sheet ref={ref} title={t.title} description={t.description}>
      <AssetTypeGrid
        options={ASSET_TYPES.map((type) => ({
          id: type,
          icon: ASSET_TYPE_ICON[type],
          title: t[type],
          description: t[HINT_KEY[type]],
          tone: ASSET_TYPE_TONE[type],
          onPress: () => onSelect(type, t[type]),
        }))}
      />
    </Sheet>
  )
}

/** The sub-label under each tile, keyed flat so the strings table stays flat. */
const HINT_KEY = {
  crypto: "cryptoHint",
  bank: "bankHint",
  document: "documentHint",
  photos: "photosHint",
  digital: "digitalHint",
  note: "noteHint",
} as const satisfies Record<AssetType, string>
