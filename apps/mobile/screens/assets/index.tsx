/**
 * ٤.١ — the vault list, in four states: locked, opening, empty, full. They
 * share one header, so moving between them changes what is under it and
 * nothing above.
 *
 * Each row says whether it is handed over to the executors or kept private.
 * Private is the owner's choice, not a fault, so nothing on this screen is
 * urgent.
 */
import { useRef, useState } from "react"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { Text } from "@workspace/ui-native/components/ui/text"
import { VaultRow } from "@workspace/ui-native/components/wassiya/vault-row"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { Lock, Search, Wallet } from "lucide-react-native"
import { router, useLocalSearchParams } from "expo-router"
import { View } from "react-native"

import { AddFab } from "@/components/add-fab"
import { EmptyTab } from "@/components/empty-tab"
import { IconButton } from "@/components/icon-button"
import { NoResults } from "@/components/no-results"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useVaultGate } from "@/hooks/use-vault-gate"
import { useStrings } from "@/i18n/use-strings"
import {
  ASSET_TYPES,
  ASSET_TYPE_ICON,
  ASSET_TYPE_ROUTE,
  type AssetType,
} from "@/lib/asset-types"
import { FilterChips, type FilterChip } from "@/components/filter-chips"
import { SearchField } from "@/components/search-field"
import { AssetTypeSheet } from "@/screens/assets/components/asset-type-sheet"
import { AssetsDecrypting } from "@/screens/assets/components/assets-decrypting"
import { AssetsLocked } from "@/screens/assets/components/assets-locked"
import { useAssetList, type AssetFilter } from "@/screens/assets/use-asset-list"

/** Chip copy per type, keyed flat so the strings table stays flat. */
const FILTER_KEY = {
  crypto: "filterCrypto",
  bank: "filterBank",
  document: "filterDocument",
  photos: "filterPhotos",
  digital: "filterDigital",
  note: "filterNote",
  investment: "filterInvestment",
  insurance: "filterInsurance",
} as const satisfies Record<AssetType, string>

export function AssetsScreen() {
  const { t, locale } = useStrings("assets")
  const { status, unlocked, unlock } = useVaultGate()
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [filter, setFilter] = useState<AssetFilter>(null)

  /**
   * Home's tile arrives with `?filter=private`.
   *
   * Adjusted during render rather than in an effect, so the first paint after
   * the tap is already filtered. Tapping the الخزنة tab plainly arrives with no
   * param, which resets the view: the tab means "my vault".
   */
  const { filter: filterParam } = useLocalSearchParams<{ filter?: string }>()
  const [seenParam, setSeenParam] = useState<string | undefined>(undefined)
  if (filterParam !== seenParam) {
    setSeenParam(filterParam)
    setFilter(filterParam === "private" ? "private" : null)
  }

  const {
    rows,
    sections,
    total,
    handedOverTotal,
    vaultSize,
    executorNames,
    byType,
  } = useAssetList(search, filter, t.undecryptable)

  /**
   * The chip row. Fixed set, always in this order — a filter that reorders
   * itself is one you have to read every time instead of reaching for.
   *
   * `byType` deliberately counts the whole vault rather than the current view,
   * so selecting a chip does not renumber the others.
   */
  const privateCount = total - handedOverTotal
  const chips: FilterChip<NonNullable<AssetFilter>>[] = [
    { key: null, label: t.filterAll!, count: total },
    ...(privateCount > 0
      ? [
          {
            key: "private" as const,
            label: t.filterPrivate!,
            count: privateCount,
          },
        ]
      : []),
    ...ASSET_TYPES.map((type) => ({
      key: type,
      label: t[FILTER_KEY[type]]!,
      count: byType[type],
    })),
  ]

  const num = (n: number) => fmtNum(n, locale)

  const addSheet = useRef<TrueSheet>(null)
  const openAdd = () => void addSheet.current?.present()

  async function chooseType(type: AssetType) {
    // Dismissed first: pushing a route out from under a presented sheet leaves
    // it hanging over the wizard on Android.
    await addSheet.current?.dismiss()
    router.push(ASSET_TYPE_ROUTE[type])
  }

  if (!unlocked) {
    return (
      <Screen>
        <ScreenHeader eyebrow={t.lockedStatus} title={t.vaultTitle!} />
        <AssetsLocked
          count={num(vaultSize)}
          countUnit={t.lockedCountUnit!}
          executorsLine={
            executorNames.length > 0
              ? t.lockedExecutors!.replace("{n}", num(executorNames.length))
              : undefined
          }
          executorNames={executorNames.slice(0, 3)}
          deliveryLine={t.lockedDelivery!}
          actionLabel={status === "unlocking" ? t.unlocking! : t.unlockCta!}
          footnote={t.lockedFootnote!}
          onUnlock={unlock}
          busy={status === "unlocking"}
        />
      </Screen>
    )
  }

  // Undefined is "still decrypting", which is a different screen from "empty".
  if (rows === undefined) {
    return (
      <Screen>
        <ScreenHeader eyebrow={t.vaultDecrypting} title={t.vaultTitle!} />
        <AssetsDecrypting />
      </Screen>
    )
  }

  const typeSheet = (
    <AssetTypeSheet ref={addSheet} onSelect={(type) => void chooseType(type)} />
  )

  if (total === 0) {
    return (
      <Screen>
        <ScreenHeader eyebrow={t.countZero} title={t.vaultTitle!} />
        <EmptyTab
          icon={Wallet}
          title={t.emptyTitle!}
          body={t.emptyLead!}
          actionLabel={t.emptyAction!}
          onAction={openAdd}
          footnote={t.emptyTrust}
          footnoteIcon={Lock}
        />
        {typeSheet}
      </Screen>
    )
  }

  return (
    <Screen float={<AddFab label={t.addAsset!} onPress={openAdd} />}>
      <ScreenHeader
        eyebrow={t
          .vaultCount!.replace("{n}", num(total))
          .replace("{m}", num(handedOverTotal))}
        title={t.vaultTitle!}
        trailing={
          <IconButton
            icon={Search}
            label={t.searchPlaceholder!}
            onPress={() => setSearching((was) => !was)}
          />
        }
      />
      <View className="gap-header grow">
        {searching ? (
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder={t.searchPlaceholder!}
            clearLabel={t.clearFilters!}
          />
        ) : null}

        <FilterChips chips={chips} selected={filter} onSelect={setFilter} />

        {rows.length === 0 ? (
          <NoResults
            title={t.noResultsTitle!}
            body={t.noResultsBody!}
            clearLabel={t.clearFilters!}
            onClear={() => {
              setFilter(null)
              setSearch("")
            }}
          />
        ) : null}

        {/* Grouped by category, with the heading dropped whenever a chip is set:
          a single section under a heading that repeats the selected chip is the
          list telling you what you just told it. Search keeps its headings —
          a query can match across types, and there the heading is the only
          thing saying which is which. */}
        <View className={rows.length === 0 ? "hidden" : "gap-header mb-auto"}>
          {sections.map((section) => (
            <View key={section.type} className="gap-2">
              {filter === null ? (
                <Text variant="sectionLabel">
                  {t[FILTER_KEY[section.type]]}
                </Text>
              ) : null}
              <View className="gap-row">
                {section.rows.map((row) => (
                  <VaultRow
                    key={row.id}
                    icon={ASSET_TYPE_ICON[row.type]}
                    title={row.title}
                    detail={row.handedOver ? t.rowHandedOver! : t.rowPrivate!}
                    isPrivate={!row.handedOver}
                    onPress={() =>
                      router.push({
                        pathname: "/assets/[id]",
                        params: { id: row.id },
                      })
                    }
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>

      {typeSheet}
    </Screen>
  )
}
