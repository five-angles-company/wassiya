/**
 * ٤.١ — the vault's contents.
 *
 * Everything a row shows is ciphertext until MK is in memory, so this screen
 * has three resting states rather than the usual two: locked, empty, and full.
 * They are kept distinct on purpose — "خزنتك فارغة" and "خزنتك مقفلة" are
 * opposite situations, and a single grey placeholder for both would tell a user
 * with forty assets that they have none.
 */
import { useState } from "react"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { Plus } from "lucide-react-native"
import { Alert, ScrollView, View } from "react-native"

import { useVaultGate } from "@/hooks/use-vault-gate"
import { fmtCount, type CountForms } from "@/i18n/plural"
import { useStrings } from "@/i18n/use-strings"
import { ASSET_TYPES, type AssetType } from "@/lib/asset-types"
import { AssetFilterChips } from "@/screens/assets/components/asset-filter-chips"
import { AssetList } from "@/screens/assets/components/asset-list"
import { AssetSearchField } from "@/screens/assets/components/asset-search-field"
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

  /**
   * 4.2 is a bottom sheet rather than a route, and it is not built yet. A
   * native alert is the stand-in: it takes no markup to remove, and it keeps
   * the CTA from being the one thing this app has already been bitten by — a
   * button that looks live and does nothing.
   */
  const openAddSheet = () =>
    Alert.alert(t.addSoonTitle, t.addSoonBody, [{ text: t.addSoonDismiss }])

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
