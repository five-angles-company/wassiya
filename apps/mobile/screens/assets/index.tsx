/**
 * ٤.١ — the vault's contents.
 *
 * Everything a row shows is ciphertext until MK is in memory, so this screen
 * has three resting states rather than the usual two: locked, empty, and full.
 * They are kept distinct on purpose — "خزنتك فارغة" and "خزنتك مقفلة" are
 * opposite situations, and a single grey placeholder for both would tell a user
 * with forty assets that they have none.
 */
import { useRef, useState } from "react"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { Plus } from "lucide-react-native"
import { router } from "expo-router"
import { ScrollView, View } from "react-native"

import { useVaultGate } from "@/hooks/use-vault-gate"
import { fmtCount, type CountForms } from "@/i18n/plural"
import { useStrings } from "@/i18n/use-strings"
import { ASSET_TYPE_ROUTE, ASSET_TYPES, type AssetType } from "@/lib/asset-types"
import { AssetFilterChips } from "@/screens/assets/components/asset-filter-chips"
import { AssetList } from "@/screens/assets/components/asset-list"
import { AssetSearchField } from "@/screens/assets/components/asset-search-field"
import { AssetTypeSheet } from "@/screens/assets/components/asset-type-sheet"
import { AssetsEmpty } from "@/screens/assets/components/assets-empty"
import { AssetsLocked } from "@/screens/assets/components/assets-locked"
import { ScreenFrame } from "@/screens/assets/components/screen-frame"
import { useAssetList } from "@/screens/assets/use-asset-list"

export function AssetsScreen() {
  const { t, locale } = useStrings("assets")
  const { status, unlocked, unlock } = useVaultGate()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<AssetType | null>(null)
  const { rows, total, byType } = useAssetList(search, filter, t.undecryptable)

  const assetForms: CountForms = {
    zero: t.countZero,
    one: t.countOne,
    two: t.countTwo,
    few: t.countFew,
    many: t.countMany,
  }
  const recipientForms: CountForms = {
    zero: t.recipientsZero,
    one: t.recipientsOne,
    two: t.recipientsTwo,
    few: t.recipientsFew,
    many: t.recipientsMany,
  }
  const count = (n: number, forms: CountForms) =>
    fmtCount(n, fmtNum(n, locale), forms, locale)

  // 4.2 lives here rather than in a route, so opening it cannot disturb this
  // screen's scroll position — which is the board's stated reason for making
  // it a sheet.
  const addSheet = useRef<TrueSheet>(null)
  const openAddSheet = () => void addSheet.current?.present()

  /**
   * Dismiss before navigating. A sheet left open while a route pushes underneath
   * it stays on screen over the new page on iOS, and dismissing it then reveals
   * the wizard with no transition — so the sheet closes first, and the push
   * reads as one movement.
   */
  const chooseType = async (type: AssetType) => {
    await addSheet.current?.dismiss()
    router.push(ASSET_TYPE_ROUTE[type])
  }

  const clearFilters = () => {
    setSearch("")
    setFilter(null)
  }

  // Locked is decided before the query: with no key there is nothing to show
  // and nothing to search, so the controls are withheld rather than disabled.
  if (!unlocked) {
    return (
      <ScreenFrame title={t.title}>
        <AssetsLocked
          title={t.lockedTitle}
          body={t.lockedBody}
          actionLabel={status === "unlocking" ? t.unlocking : t.unlock}
          onUnlock={unlock}
          busy={status === "unlocking"}
        />
      </ScreenFrame>
    )
  }

  // `rows === undefined` is still loading, and must not be mistaken for an
  // empty vault — `total` is only meaningful once the decryption pass has run.
  if (rows !== undefined && total === 0) {
    return (
      <ScreenFrame title={t.title}>
        <AssetsEmpty
          title={t.emptyTitle}
          body={t.emptyBody}
          actionLabel={t.emptyAction}
          browseLabel={t.emptyBrowse}
          onAdd={openAddSheet}
        />
        <AssetTypeSheet ref={addSheet} onSelect={chooseType} />
      </ScreenFrame>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="grow pb-28 pt-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-gutter mb-header">
          <Text variant="screenTitle">{t.title}</Text>
          <Text variant="meta" className="text-muted-foreground mt-1">
            {count(total, assetForms)}
          </Text>
        </View>

        <View className="px-gutter mb-3">
          <AssetSearchField
            value={search}
            onChangeText={setSearch}
            placeholder={t.searchPlaceholder}
            clearLabel={t.clearFilters}
          />
        </View>

        <View className="mb-header">
          <AssetFilterChips
            chips={[
              { type: null, label: t.filterAll, count: total },
              ...ASSET_TYPES.map((type) => ({
                type,
                label: t[FILTER_KEY[type]],
                count: byType[type],
              })),
            ]}
            selected={filter}
            onSelect={setFilter}
          />
        </View>

        <View className="px-gutter">
          <AssetList
            rows={rows}
            recipientLabel={(n) => count(n, recipientForms)}
            noResultsTitle={t.noResultsTitle}
            noResultsBody={t.noResultsBody}
            clearLabel={t.clearFilters}
            onClear={clearFilters}
            onOpen={(id) =>
              router.push({ pathname: "/assets/[id]", params: { id } })
            }
          />
        </View>
      </ScrollView>

      {/* Pinned rather than trailing the list: with forty assets a button at
          the end of the scroll is unreachable without scrolling to it, and
          adding is the screen's primary action at any scroll position. */}
      <View className="px-gutter absolute bottom-0 start-0 end-0 pb-5">
        <Button onPress={openAddSheet}>
          <Icon as={Plus} className="text-primary-foreground size-4.5" />
          <Text>{t.add}</Text>
        </Button>
      </View>

      {/* A sibling of the ScrollView rather than a child. Not a requirement —
          TrueSheet's host view is `absoluteFill` with `zIndex: -9999`, so it
          takes no layout space wherever it sits, and `SheetSelect` mounts one
          inside a scroller on 4.4 without trouble. It is here because the sheet
          belongs to the screen, not to the list, and a child of the content
          container would be positioned against the scrolled content. */}
      <AssetTypeSheet ref={addSheet} onSelect={chooseType} />
    </View>
  )
}

/** Chip copy lives under its own key per type, so the table stays flat. */
const FILTER_KEY = {
  crypto: "filterCrypto",
  bank: "filterBank",
  document: "filterDocument",
  photos: "filterPhotos",
  digital: "filterDigital",
  note: "filterNote",
} as const satisfies Record<AssetType, string>
