import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { PickerRow } from "@workspace/ui-native/components/wassiya/picker-row"
import { Sheet } from "@workspace/ui-native/components/wassiya/sheet"
import type * as React from "react"
import { View } from "react-native"

import { useStrings } from "@/i18n/use-strings"
import { ASSET_TYPES, ASSET_TYPE_ICON, type AssetType } from "@/lib/asset-types"

/**
 * ٤.٢ — "ماذا تضيف؟"
 *
 * ## A sheet, not a route
 *
 * Back dismisses it without unwinding ٤.١'s scroll position. That matters more
 * here than anywhere else in the vault: the thing you want to add is often
 * decided *after* scrolling a long list, and a pushed screen sends you back to
 * the top of it. It is also the cheaper gesture for the commonest outcome —
 * opening the picker and changing your mind.
 *
 * ## The rows are the v2 board's, the container is not
 *
 * The board draws this as a full screen; the owner asked for the sheet back.
 * What is inside it stays exactly as drawn — the same rows as the vault list,
 * so the picker reads as that list's own vocabulary rather than as a menu, with
 * second lines that are **examples, not definitions**: "بريد، متجر، بث" tells
 * you where a Netflix login goes; "digital account" never will.
 *
 * ## Sizing
 *
 * Six content-hugging rows on the default single `'auto'` detent, and
 * deliberately **not** `scrollable`: a scroller here inflates the sheet to
 * roughly nine-tenths of the screen and strands the rows at the top. See
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
    <Sheet ref={ref} title={t.pickTitle} contentClassName="px-[22px] pb-7">
      <View>
        {ASSET_TYPES.map((type, i) => (
          <PickerRow
            key={type}
            icon={ASSET_TYPE_ICON[type]}
            title={t[NAME_KEY[type]]!}
            examples={t[EXAMPLES_KEY[type]]!}
            divider={i < ASSET_TYPES.length - 1}
            onPress={() => onSelect(type, t[NAME_KEY[type]]!)}
          />
        ))}
      </View>
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
