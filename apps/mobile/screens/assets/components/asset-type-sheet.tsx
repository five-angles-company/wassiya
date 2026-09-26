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
 * position, and what to add is usually decided *after* scrolling.
 *
 * A 2×3 grid of `AssetTypeTile`, which carries `StatTile`'s metrics exactly — a
 * type tile, a Home tile and a vault card are one object at three sizes. Six
 * close the grid cleanly; an odd count would stretch the last across the full
 * width and read as a different kind of thing.
 *
 * **Every disc is sand, deliberately.** Terracotta means "needs you" on Home
 * and in the list, and a terracotta "محفظة رقمية" would read as urgent when
 * nothing on this screen is.
 *
 * Three content-hugging rows on the default `'auto'` detent, and deliberately
 * **not** `scrollable` — a scroller inflates the sheet to roughly nine-tenths of
 * the screen and strands the tiles at the top. See `Sheet`'s own sizing note.
 */
export type AssetTypeSheetProps = {
  ref?: React.Ref<TrueSheet>
  /**
   * Receives the type **and its localised name**, because every caller so far
   * needs the label for its own copy.
   */
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
