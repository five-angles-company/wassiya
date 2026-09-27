import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { AssetTypeGrid } from "@workspace/ui-native/components/wassiya/asset-type-grid"
import { Sheet } from "@workspace/ui-native/components/wassiya/sheet"
import type * as React from "react"

import { useStrings } from "@/i18n/use-strings"
import type { AssetType } from "@/lib/asset-types"
import { useAssetTypeOptions } from "@/screens/assets/components/use-asset-type-options"

/**
 * ٤.٢ — "ماذا تضيف؟"
 *
 * A sheet, not a route: back dismisses it without unwinding ٤.١'s scroll
 * position. Rows of two `AssetTypeTile`, on `StatTile`'s metrics — a type
 * tile, a Home tile and a vault card are one object at three sizes.
 *
 * **Every disc is sand, deliberately.** Terracotta means "needs you" on Home
 * and in the list, and a terracotta tile would read as urgent when nothing on
 * this screen is.
 *
 * Content-hugging on the default `'auto'` detent, and deliberately **not**
 * `scrollable` — a scroller inflates the sheet to roughly nine-tenths of the
 * screen and strands the tiles at the top. See `Sheet`'s own sizing note.
 */
export type AssetTypeSheetProps = {
  ref?: React.Ref<TrueSheet>
  /** Receives the type **and its localised name**, for the caller's own copy. */
  onSelect: (type: AssetType, label: string) => void
}

export function AssetTypeSheet({ ref, onSelect }: AssetTypeSheetProps) {
  const { t } = useStrings("assets/new-sheet")
  const options = useAssetTypeOptions(onSelect)

  return (
    <Sheet ref={ref} title={t.pickTitle} contentClassName="pb-7">
      <AssetTypeGrid options={options} />
    </Sheet>
  )
}
