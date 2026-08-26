/**
 * ٤.١ — the vault list.
 *
 * ## What this screen deliberately does not have
 *
 * No filter chips, no permanent search field, no group headings, no type
 * sections, no badges, no protection bar, no per-row chevrons, no cards. All of
 * it went, because *"a vault is a place you visit rarely and calmly — it should
 * be almost empty."* A heading for every three rows is what made the last
 * version feel heavy.
 *
 * Search is an **icon**. At forty-three items you scroll; a field standing open
 * on the screen would imply otherwise. It surfaces on tap, and the design note
 * expects it to become permanent only past a hundred items.
 *
 * ## One flat list, irreplaceable first
 *
 * A seed phrase, then a deed, then a password. Nothing labels the order — the
 * order simply *is* that, so the top of the list is always what matters most.
 * Type lives in the small tile and never in a heading.
 *
 * ## One alarm
 *
 * The terracotta line at the top is the only urgent thing on the screen, and it
 * vanishes at zero rather than turning olive: "everything is fine" is not news.
 * Individual unrouted rows say so in their own recipient slot, so the gap reads
 * both in summary and in place.
 */
import { useRef, useState } from "react"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { VaultRow } from "@workspace/ui-native/components/wassiya/vault-row"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { Plus, Search } from "lucide-react-native"
import { router } from "expo-router"
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
import { AssetFilterChips } from "@/screens/assets/components/asset-filter-chips"
import { AssetSearchField } from "@/screens/assets/components/asset-search-field"
import { AssetTypeSheet } from "@/screens/assets/components/asset-type-sheet"
import { AssetsDecrypting } from "@/screens/assets/components/assets-decrypting"
import { AssetsEmpty } from "@/screens/assets/components/assets-empty"
import { AssetsLocked } from "@/screens/assets/components/assets-locked"
import { useAssetList } from "@/screens/assets/use-asset-list"

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
  const { t: routing } = useStrings("will/routing")
  const { status, unlocked, unlock } = useVaultGate()
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [filter, setFilter] = useState<AssetType | null>(null)
  const { rows, total, routedTotal, vaultSize, heirNames, byType } = useAssetList(
    search,
    filter,
    t.undecryptable,
    { executor: routing.executor! }
  )

  /**
   * The chip row. Fixed set, always in this order — a filter that reorders
   * itself is one you have to read every time instead of reaching for.
   *
   * `byType` deliberately counts the whole vault rather than the current view,
   * so selecting a chip does not renumber the others.
   */
  const chips = [
    { type: null, label: t.filterAll!, count: total },
    ...ASSET_TYPES.map((type) => ({
      type,
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
      <Screen inset="footer" contentClassName="gap-header">
        <AssetsLocked
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
      <Screen inset="footer" contentClassName="gap-header">
        <AssetsDecrypting title={t.vaultTitle!} subtitle={t.vaultDecrypting!} />
      </Screen>
    )
  }

  if (total === 0) {
    return (
      <Screen inset="footer" contentClassName="gap-header">
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
        <AssetTypeSheet ref={addSheet} onSelect={(type) => void chooseType(type)} />
      </Screen>
    )
  }

  // Both from the whole vault, never the filtered view — see `routedTotal`.
  const routed = routedTotal
  const unrouted = total - routedTotal

  return (
    <Screen
      inset="footer"
      contentClassName="gap-header"
      /*
        A round button in the corner rather than a full-width slab. Adding is
        the screen's primary action at any scroll position, so it stays pinned —
        but a bar across the whole width competes with the list it sits under,
        permanently, for a tap most sessions never make.

        It rides `Screen`'s footer slot, which is already outside the scroll
        area, so it needs no absolute positioning of its own.
      */
      footer={
        <View className="items-end">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.addAsset}
            onPress={openAdd}
            className="bg-primary active:bg-terracotta-600 size-14 items-center justify-center rounded-full shadow-md"
          >
            <Icon as={Plus} size={26} strokeWidth={2.75} className="text-background" />
          </Pressable>
        </View>
      }
    >
      {/* Home's header block: a quiet line over a 19px name, one 40px circle
          at the far end. */}
      <View className="flex-row items-center gap-3">
        <View className="min-w-0 flex-1">
          <Text variant="metaSm">
            {t.vaultCount!.replace("{n}", num(total)).replace("{m}", num(routed))}
          </Text>
          <Text variant="pageTitle">{t.vaultTitle}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.searchPlaceholder}
          onPress={() => setSearching((was) => !was)}
          className="bg-card active:bg-sand-300 size-10 shrink-0 items-center justify-center rounded-full"
        >
          <Icon as={Search} size={18} strokeWidth={2.75} className="text-foreground" />
        </Pressable>
      </View>

      {searching ? (
        <AssetSearchField
          value={search}
          onChangeText={setSearch}
          placeholder={t.searchPlaceholder!}
          clearLabel={t.clearFilters!}
        />
      ) : null}

      <AssetFilterChips chips={chips} selected={filter} onSelect={setFilter} />

      {/* The same banner Home uses for its own alarm. One per screen, and gone
          at zero rather than turning olive — "everything is fine" is not news. */}
      {unrouted > 0 && !searching ? (
        <AlertBanner
          variant="notice"
          description={t.unroutedAlert!.replace("{n}", num(unrouted))}
          actions={
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/plan/routing")}
              hitSlop={8}
            >
              <Text variant="action" className="text-terracotta-800 font-body-bold">
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
            <Text variant="action" className="text-terracotta-800 font-body-bold">
              {t.clearFilters}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* `gap-row` — Home's tile spacing. Cards separate themselves, so there
          are no hairlines between them. */}
      <View className={rows.length === 0 ? "hidden" : "gap-row mb-auto"}>
        {rows.map((row) => (
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

      <AssetTypeSheet ref={addSheet} onSelect={(type) => void chooseType(type)} />
    </Screen>
  )
}
