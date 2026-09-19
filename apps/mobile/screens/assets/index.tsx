/**
 * ٤.١ — the vault list.
 *
 * No filter chips, no permanent search field, no group headings, no type
 * sections, no badges, no protection bar, no per-row chevrons, no cards:
 * *"a vault is a place you visit rarely and calmly — it should be almost
 * empty."* Search is an icon, and the design note expects it to become a
 * permanent field only past a hundred items.
 *
 * One flat list, irreplaceable first — a seed phrase, then a deed, then a
 * password. Nothing labels the order; the order simply is that, and type lives
 * in the small tile rather than a heading.
 *
 * The terracotta line at the top is the only urgent thing on the screen, and it
 * vanishes at zero rather than turning olive: "everything is fine" is not news.
 */
import { useRef, useState } from "react"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { VaultRow } from "@workspace/ui-native/components/wassiya/vault-row"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { Plus, Search } from "lucide-react-native"
import { router, useLocalSearchParams } from "expo-router"
import { Pressable, View } from "react-native"

import { Screen } from "@/components/screen"
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
import { AssetsEmpty } from "@/screens/assets/components/assets-empty"
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
} as const satisfies Record<AssetType, string>

export function AssetsScreen() {
  const { t, locale } = useStrings("assets")
  const { t: routing } = useStrings("assets/recipients")
  const { status, unlocked, unlock } = useVaultGate()
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [filter, setFilter] = useState<AssetFilter>(null)

  /**
   * Home's التوجيه tile arrives with `?filter=unrouted`.
   *
   * Adjusted during render rather than in an effect — the React-sanctioned way
   * to react to a changed prop — so the first paint after the tap is already
   * filtered instead of flashing the whole vault. Tapping the الخزنة tab plainly
   * arrives with no param, which resets the view, and that is the behaviour you
   * want: the tab means "my vault", not "wherever I last was".
   */
  const { filter: filterParam } = useLocalSearchParams<{ filter?: string }>()
  const [seenParam, setSeenParam] = useState<string | undefined>(undefined)
  if (filterParam !== seenParam) {
    setSeenParam(filterParam)
    setFilter(filterParam === "unrouted" ? "unrouted" : null)
  }

  const { rows, sections, total, routedTotal, vaultSize, heirNames, byType } =
    useAssetList(search, filter, t.undecryptable, {
      executor: routing.executor!,
    })

  /**
   * The chip row. Fixed set, always in this order — a filter that reorders
   * itself is one you have to read every time instead of reaching for.
   *
   * `byType` deliberately counts the whole vault rather than the current view,
   * so selecting a chip does not renumber the others.
   */
  const unrouted = total - routedTotal
  const chips: FilterChip<NonNullable<AssetFilter>>[] = [
    { key: null, label: t.filterAll!, count: total },
    // Second, not last: it is the only chip that can be urgent, and a chip you
    // may need is worth more than one more category you already know you have.
    // Absent at zero — see the component's own note.
    ...(unrouted > 0
      ? [
          {
            key: "unrouted" as const,
            label: t.filterUnrouted!,
            count: unrouted,
            urgent: true,
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
      <Screen contentClassName="gap-header">
        <AssetsLocked
          title={t.vaultTitle!}
          status={t.lockedStatus!}
          count={num(vaultSize)}
          countUnit={t.lockedCountUnit!}
          heirsLine={
            heirNames.length > 0
              ? t.lockedHeirs!.replace("{n}", num(heirNames.length))
              : undefined
          }
          heirNames={heirNames.slice(0, 3)}
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
      <Screen contentClassName="gap-header">
        <AssetsDecrypting title={t.vaultTitle!} subtitle={t.vaultDecrypting!} />
      </Screen>
    )
  }

  if (total === 0) {
    return (
      <Screen contentClassName="gap-header">
        {/* The empty vault keeps a full-width button: it is the only action on
            an otherwise blank screen, and a round button in the corner of one
            reads as an afterthought rather than an invitation. */}
        <AssetsEmpty
          title={t.vaultTitle!}
          subtitle={t.emptySubtitle!}
          lead={t.emptyLead!}
          addLabel={t.addAsset!}
          onAdd={openAdd}
        />
        <AssetTypeSheet
          ref={addSheet}
          onSelect={(type) => void chooseType(type)}
        />
      </Screen>
    )
  }

  // From the whole vault, never the filtered view — see `routedTotal`.
  const routed = routedTotal

  return (
    <Screen
      contentClassName="gap-header"
      /*
        A round button in the corner rather than a full-width slab. Adding is
        the screen's primary action at any scroll position, so it stays pinned —
        but a bar across the whole width competes with the list it sits under,
        permanently, for a tap most sessions never make.

        `float`, not `footer`: a footer sits *after* the scroll area and shortens
        it, so the list ended at an opaque strip a couple of rows above the tab
        bar. A float paints over the list instead, and `Screen` pads the content
        so the last card still clears the button.
      */
      float={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.addAsset}
          onPress={openAdd}
          className="size-14 items-center justify-center rounded-full bg-primary shadow-md active:bg-terracotta-600"
        >
          <Icon
            as={Plus}
            size={26}
            strokeWidth={2.75}
            className="text-background"
          />
        </Pressable>
      }
    >
      {/* Home's header block: a quiet line over a 19px name, one 40px circle
          at the far end. */}
      <View className="flex-row items-center gap-3">
        <View className="min-w-0 flex-1">
          <Text variant="metaSm">
            {t
              .vaultCount!.replace("{n}", num(total))
              .replace("{m}", num(routed))}
          </Text>
          <Text variant="pageTitle">{t.vaultTitle}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.searchPlaceholder}
          onPress={() => setSearching((was) => !was)}
          className="size-10 shrink-0 items-center justify-center rounded-full bg-card active:bg-sand-300"
        >
          <Icon
            as={Search}
            size={18}
            strokeWidth={2.75}
            className="text-foreground"
          />
        </Pressable>
      </View>

      {searching ? (
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder={t.searchPlaceholder!}
          clearLabel={t.clearFilters!}
        />
      ) : null}

      <FilterChips chips={chips} selected={filter} onSelect={setFilter} />

      {/* The same banner Home uses for its own alarm. One per screen, and gone
          at zero rather than turning olive — "everything is fine" is not news. */}
      {unrouted > 0 && !searching ? (
        <AlertBanner
          variant="notice"
          description={t.unroutedAlert!.replace("{n}", num(unrouted))}
          actions={
            <Pressable
              accessibilityRole="button"
              // Selects the chip rather than pushing a screen. "من يستلم ماذا؟"
              // was a whole route whose only job was this list, filtered.
              onPress={() => setFilter("unrouted")}
              hitSlop={8}
            >
              <Text
                variant="action"
                className="font-body-bold text-terracotta-800"
              >
                {t.unroutedAction}
              </Text>
            </Pressable>
          }
        />
      ) : null}

      {/* A filter or a search can empty a vault that is not empty. Different
          state, different words: nothing is missing, the view is just narrow. */}
      {rows.length === 0 ? (
        <View className="mb-auto gap-2 pt-2">
          <Text variant="rowTitle">{t.noResultsTitle}</Text>
          <Text variant="prose" className="text-muted-foreground">
            {t.noResultsBody}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setFilter(null)
              setSearch("")
            }}
            hitSlop={8}
            className="mt-1 self-start"
          >
            <Text
              variant="action"
              className="font-body-bold text-terracotta-800"
            >
              {t.clearFilters}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* `gap-row` — Home's tile spacing. Cards separate themselves, so there
          are no hairlines between them. */}
      {/* Grouped by category, with the heading dropped whenever a chip is set:
          a single section under a heading that repeats the selected chip is the
          list telling you what you just told it. Search keeps its headings —
          a query can match across types, and there the heading is the only
          thing saying which is which. */}
      <View className={rows.length === 0 ? "hidden" : "gap-header mb-auto"}>
        {sections.map((section) => (
          <View key={section.type} className="gap-2">
            {filter === null ? (
              <Text variant="sectionLabel">{t[FILTER_KEY[section.type]]}</Text>
            ) : null}
            <View className="gap-row">
              {section.rows.map((row) => (
                <VaultRow
                  key={row.id}
                  icon={ASSET_TYPE_ICON[row.type]}
                  title={row.title}
                  // The shared bucket is not a name, so it never reaches
                  // `recipients` — without this the card's second line is blank and
                  // the row is a different height from every other one.
                  recipients={
                    row.allHeirs
                      ? [routing.allHeirs!, ...row.recipients].join("، ")
                      : row.recipients.join("، ")
                  }
                  unroutedLabel={
                    row.recipientCount === 0 ? t.recipientsZero : undefined
                  }
                  faces={row.recipients}
                  allHeirsLabel={row.allHeirs ? t.allHeirsShort : undefined}
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

      <AssetTypeSheet
        ref={addSheet}
        onSelect={(type) => void chooseType(type)}
      />
    </Screen>
  )
}
