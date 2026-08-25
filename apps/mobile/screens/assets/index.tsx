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
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { Plus, Search } from "lucide-react-native"
import { router } from "expo-router"
import { Pressable, View } from "react-native"

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
import { AssetSuggestions } from "@/screens/assets/components/asset-suggestions"
import { AssetTypeSheet } from "@/screens/assets/components/asset-type-sheet"
import { AssetsEmpty } from "@/screens/assets/components/assets-empty"
import { AssetsLocked } from "@/screens/assets/components/assets-locked"
import { useAssetList } from "@/screens/assets/use-asset-list"

export function AssetsScreen() {
  const { t, locale } = useStrings("assets")
  const { status, unlocked, unlock } = useVaultGate()
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [filter, setFilter] = useState<AssetType | null>(null)
  const { rows, total, byType } = useAssetList(search, filter, t.undecryptable)

  const assetForms: CountForms = {
    zero: t.countZero,
    one: t.countOne,
    two: t.countTwo,
    few: t.countFew,
    many: t.countMany,
  }
  const count = (n: number, forms: CountForms) =>
    fmtCount(n, fmtNum(n, locale), forms, locale)

  const groupLabel = (kind: DestinationKind) => GROUP_KEY[kind](t)

  /**
   * Chrome earns its place.
   *
   * Six filter chips and a full-width search field over three assets is more
   * furniture than content — and the filters cannot even narrow anything
   * useful until there is something to narrow. Both appear once the vault is
   * big enough to need them, and the search field appears immediately if the
   * user asks for it.
   */
  const CHROME_THRESHOLD = 7
  const showChips = total >= CHROME_THRESHOLD
  const showSearch = searching || search.length > 0 || total >= CHROME_THRESHOLD

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
      /*
        A round button in the corner rather than a full-width slab.
        Adding is the screen's primary action at any scroll position, so it
        stays pinned — but a bar across the whole width competed with the
        content it sits under, permanently, for a tap most sessions never make.
        It rides `Screen`'s footer slot, which is already outside the scroll
        area, so it needs no absolute positioning of its own.
      */
      footer={
        <View className="items-end">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.add}
            onPress={openAddSheet}
            className="bg-primary active:bg-terracotta-600 size-14 items-center justify-center rounded-full shadow-md"
          >
            <Icon as={Plus} size={26} strokeWidth={2.75} className="text-primary-foreground" />
          </Pressable>
        </View>
      }
    >
      <ScreenHeader
        title={t.title}
        level="root"
        trailing={
          <View className="flex-row items-center gap-3">
            <Text variant="metaSm">{count(total, assetForms)}</Text>
            {/* The field itself is the exception, not the default — see
                `showSearch`. This is how you ask for it. */}
            {!showSearch ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.searchPlaceholder}
                onPress={() => setSearching(true)}
                className="active:bg-sand-300 bg-card size-10 items-center justify-center rounded-full"
              >
                <Icon as={Search} size={18} strokeWidth={2.75} />
              </Pressable>
            ) : null}
          </View>
        }
      />

      {showSearch ? (
        <View className="mb-3">
          <AssetSearchField
            value={search}
            onChangeText={setSearch}
            placeholder={t.searchPlaceholder}
            clearLabel={t.clearFilters}
          />
        </View>
      ) : null}

      {showChips ? (
        /* Bleeds past the gutter so the chip strip scrolls edge to edge — the
           only thing on this screen that should. */
        <View className="-mx-gutter mb-3">
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
      ) : null}

      <AssetList
        rows={rows}
        categoryLabel={(row) => t[FILTER_KEY[row.type]]!}
        groupLabel={groupLabel}
        groupCount={(n) => count(n, assetForms)}
        noResultsTitle={t.noResultsTitle}
        noResultsBody={t.noResultsBody}
        clearLabel={t.clearFilters}
        onClear={clearFilters}
        onOpen={(id) => router.push({ pathname: "/assets/[id]", params: { id } })}
      />

      {/* Only while the vault cannot yet stand on its own. Past this it is
          clutter, and the grid has enough to say for itself. */}
      {total < 4 ? (
        <AssetSuggestions
          className="mt-header"
          title={t.suggestTitle}
          labelFor={(type) => t[FILTER_KEY[type]]!}
          onPick={(type) => router.push(ASSET_TYPE_ROUTE[type])}
        />
      ) : null}

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
