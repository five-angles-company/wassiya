/**
 * الخزنة — the vault's contents, grouped by where they go.
 *
 * ## Three resting states, kept distinct
 *
 * Everything a row shows is ciphertext until MK is in memory, so this screen
 * has three resting states rather than the usual two: locked, empty, and full.
 * "خزنتك فارغة" and "خزنتك مقفلة" are opposite situations, and one grey
 * placeholder for both would tell a user with forty assets that they have none.
 *
 * ## Destination, not type
 *
 * The list groups by where a thing goes, with "بلا وجهة" pinned first — see
 * `group-by-destination.ts` for why. Type survives as a filter, because finding
 * a thing and checking the vault is complete are different jobs and only the
 * second one belongs in the structure.
 */
import { useRef, useState } from "react"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { Plus } from "lucide-react-native"
import { router } from "expo-router"
import { View } from "react-native"

import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useVaultGate } from "@/hooks/use-vault-gate"
import { fmtCount, type CountForms } from "@/i18n/plural"
import { useStrings } from "@/i18n/use-strings"
import { ASSET_TYPE_ROUTE, ASSET_TYPES, type AssetType } from "@/lib/asset-types"
import type { DestinationKind } from "@/screens/assets/group-by-destination"
import { AssetFilterChips } from "@/screens/assets/components/asset-filter-chips"
import { AssetList } from "@/screens/assets/components/asset-list"
import { AssetSearchField } from "@/screens/assets/components/asset-search-field"
import { AssetTypeSheet } from "@/screens/assets/components/asset-type-sheet"
import { AssetsEmpty } from "@/screens/assets/components/assets-empty"
import { AssetsLocked } from "@/screens/assets/components/assets-locked"
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

  const groupLabel = (kind: DestinationKind) => GROUP_KEY[kind](t)

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
      <Screen inset="tab">
        <ScreenHeader title={t.title} level="root" />
        <AssetsLocked
          title={t.lockedTitle}
          body={t.lockedBody}
          actionLabel={status === "unlocking" ? t.unlocking : t.unlock}
          onUnlock={unlock}
          busy={status === "unlocking"}
        />
      </Screen>
    )
  }

  // `rows === undefined` is still loading, and must not be mistaken for an
  // empty vault — `total` is only meaningful once the decryption pass has run.
  if (rows !== undefined && total === 0) {
    return (
      <Screen inset="tab">
        <ScreenHeader title={t.title} level="root" />
        <AssetsEmpty
          title={t.emptyTitle}
          body={t.emptyBody}
          actionLabel={t.emptyAction}
          browseLabel={t.emptyBrowse}
          onAdd={openAddSheet}
        />
        <AssetTypeSheet ref={addSheet} onSelect={chooseType} />
      </Screen>
    )
  }

  return (
    <Screen
      inset="footer"
      keyboard
      /* Pinned rather than trailing the list: with forty assets a button at the
         end of the scroll is unreachable without scrolling to it, and adding is
         the screen's primary action at any scroll position. */
      footer={
        <Button onPress={openAddSheet}>
          <Icon as={Plus} className="text-primary-foreground size-4.5" />
          <Text>{t.add}</Text>
        </Button>
      }
    >
      <ScreenHeader
        title={t.title}
        level="root"
        trailing={<Text variant="metaSm">{count(total, assetForms)}</Text>}
      />

      <AssetSearchField
        value={search}
        onChangeText={setSearch}
        placeholder={t.searchPlaceholder}
        clearLabel={t.clearFilters}
      />

      {/* Bleeds past the gutter so the chip strip can scroll edge to edge —
          the only thing on this screen that should. */}
      <View className="-mx-gutter my-3">
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

      <AssetList
        rows={rows}
        recipientLabel={(n) => count(n, recipientForms)}
        groupLabel={groupLabel}
        groupCount={(n) => count(n, assetForms)}
        noResultsTitle={t.noResultsTitle}
        noResultsBody={t.noResultsBody}
        clearLabel={t.clearFilters}
        onClear={clearFilters}
        onOpen={(id) => router.push({ pathname: "/assets/[id]", params: { id } })}
      />

      {/* A sibling of the scroll area rather than a child. TrueSheet's host view
          is `absoluteFill` with `zIndex: -9999`, so it takes no layout space
          wherever it sits; it lives here because the sheet belongs to the
          screen, not to the list. */}
      <AssetTypeSheet ref={addSheet} onSelect={chooseType} />
    </Screen>
  )
}

/** Group headings, keyed by destination kind. */
const GROUP_KEY = {
  none: (t: Record<string, string>) => t.groupNone!,
  all: (t: Record<string, string>) => t.groupAll!,
  explicit: (t: Record<string, string>) => t.groupExplicit!,
} as const satisfies Record<DestinationKind, (t: Record<string, string>) => string>

/** Chip copy lives under its own key per type, so the table stays flat. */
const FILTER_KEY = {
  crypto: "filterCrypto",
  bank: "filterBank",
  document: "filterDocument",
  photos: "filterPhotos",
  digital: "filterDigital",
  note: "filterNote",
} as const satisfies Record<AssetType, string>
