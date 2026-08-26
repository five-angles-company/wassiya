import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { AssetTypeGrid } from "@workspace/ui-native/components/wassiya/asset-type-grid"
import { Sheet } from "@workspace/ui-native/components/wassiya/sheet"
import type * as React from "react"

import { useStrings } from "@/i18n/use-strings"
import { ASSET_TYPES, ASSET_TYPE_ICON, type AssetType } from "@/lib/asset-types"

/**
 * ٤.٢ — "ماذا تضيف؟"
 *
 * ## A sheet, not a route
 *
 * Back dismisses it without unwinding ٤.١'s scroll position, which matters more
 * here than anywhere else in the vault: what you want to add is usually decided
 * *after* scrolling, and a pushed screen sends you back to the top. It is also
 * the cheaper gesture for the commonest outcome — opening the picker and
 * changing your mind.
 *
 * ## A 2×3 grid of the same tile Home uses
 *
 * `AssetTypeTile` now carries `StatTile`'s metrics exactly, so a type tile, a
 * Home tile and a vault card are one object at three sizes. Six of them close
 * the grid cleanly; an odd count would leave the last one stretched across the
 * full width, reading as a different kind of thing rather than the last of a
 * set.
 *
 * ## Every disc is sand, deliberately
 *
 * `ASSET_TYPE_TONE` exists and groups these by what they hold — secrets
 * terracotta, files olive. It is not used, for the same reason the vault list
 * does not use it: terracotta means **"needs you"** on Home and in the list, and
 * a terracotta "محفظة رقمية" here would read as urgent when nothing on this
 * screen is. The icons already tell the six apart; colour stays free to mean
 * one thing.
 *
 * ## Sizing
 *
 * Three content-hugging rows on the default single `'auto'` detent, and
 * deliberately **not** `scrollable`: a scroller here inflates the sheet to
 * roughly nine-tenths of the screen and strands the tiles at the top. See
 * `Sheet`'s own sizing note.
 */
export type AssetTypeSheetProps = {
  ref?: React.Ref<TrueSheet>
  /**
   * Receives the type **and its localised name**, because every caller so far
   * needs the label for its own copy, and re-deriving it from the type means a
   * second lookup table that can disagree with this one.
   */
  onSelect: (type: AssetType, label: string) => void
}

export function AssetTypeSheet({ ref, onSelect }: AssetTypeSheetProps) {
  const { t } = useStrings("assets/new-sheet")

  return (
    <Sheet ref={ref} title={t.pickTitle} contentClassName="pb-7">
      <AssetTypeGrid
        options={ASSET_TYPES.map((type) => ({
          id: type,
          icon: ASSET_TYPE_ICON[type],
          title: t[NAME_KEY[type]]!,
          description: t[EXAMPLES_KEY[type]]!,
          onPress: () => onSelect(type, t[NAME_KEY[type]]!),
        }))}
      />
    </Sheet>
  )
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
