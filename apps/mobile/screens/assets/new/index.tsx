/**
 * ٤.٢ — what are you adding?
 *
 * A screen, not a sheet. The picker used to be a bottom sheet of six tinted
 * tiles; the v2 board makes it the same rows as the vault list, so choosing a
 * type reads as the list's own vocabulary rather than as a menu that appeared
 * over it. One tile design fewer, one grammar fewer to learn.
 *
 * ## Fixed order, most-added first
 *
 * Never sorted by recency or usage. Muscle memory is the whole value of a
 * six-item list that someone opens a handful of times a year — a list that
 * reorders itself is one they have to read every time.
 *
 * ## Dismiss, don't retreat
 *
 * The top-left control is an X. Choosing what to add is a decision you abandon,
 * not a place you came from — and an X is the one glyph on these screens that
 * never has to mirror.
 */
import { Text } from "@workspace/ui-native/components/ui/text"
import { PickerRow } from "@workspace/ui-native/components/wassiya/picker-row"
import { ScreenTop } from "@workspace/ui-native/components/wassiya/screen-top"
import { router } from "expo-router"
import { View } from "react-native"

import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import {
  ASSET_TYPE_ICON,
  ASSET_TYPE_ROUTE,
  ASSET_TYPES,
  type AssetType,
} from "@/lib/asset-types"

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

export function AddAssetScreen() {
  const { t } = useStrings("assets/new-sheet")

  return (
    <Screen bleed contentClassName="px-[22px] pt-5">
      <ScreenTop
        backLabel={t.close!}
        back="close"
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/assets"))}
        className="mb-6"
      />

      <Text className="font-heading-extrabold text-foreground mb-[26px] text-[28px] leading-[1.25]">
        {t.pickTitle}
      </Text>

      <View className="mb-auto">
        {ASSET_TYPES.map((type, i) => (
          <PickerRow
            key={type}
            icon={ASSET_TYPE_ICON[type]}
            title={t[NAME_KEY[type]]!}
            examples={t[EXAMPLES_KEY[type]]!}
            divider={i < ASSET_TYPES.length - 1}
            onPress={() => router.push(ASSET_TYPE_ROUTE[type])}
          />
        ))}
      </View>
    </Screen>
  )
}
