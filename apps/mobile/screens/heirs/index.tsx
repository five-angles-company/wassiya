/**
 * ٥.١ — الورثة. The people, and only the people: no coverage strip, no routing
 * CTA — "not asset division just heirs management". Routing stays one tap away
 * on Home's التوجيه tile and the vault's unrouted banner.
 *
 * The per-heir "لا تستلم شيئاً بعد" line stayed, because it is not division — it
 * is the one fact about an heir that can be silently wrong, and the exact mirror
 * of "بلا مستلم" on an asset.
 *
 * The whole card opens ٥.٤; editing lives there rather than behind a per-row
 * pencil, which would put a second target on every card for the rarer errand.
 */
import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ListEmpty } from "@/components/list-empty"
import { HeirCard } from "@workspace/ui-native/components/wassiya/heir-card"
import { fmtNum, fmtPhoneMasked } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { Plus, Search } from "lucide-react-native"
import { Pressable, View } from "react-native"

import { FilterChips, type FilterChip } from "@/components/filter-chips"
import { Screen } from "@/components/screen"
import { SearchField } from "@/components/search-field"
import { fmtCount, type CountForms } from "@/i18n/plural"
import { useStrings } from "@/i18n/use-strings"
import { RELATIONS, relationLabel } from "@/screens/heirs/relations"

type RelationKey = (typeof RELATIONS)[number][0]
/** "noAssets" is the state chip; the rest are relations. */
type HeirFilter = "noAssets" | RelationKey

const RELATION_FILTER_LABEL = {
  daughter: "filterDaughter",
  son: "filterSon",
  husband: "filterHusband",
  wife: "filterWife",
  father: "filterFather",
  mother: "filterMother",
  sibling: "filterSibling",
  other: "filterOther",
} as const satisfies Record<RelationKey, string>

export function HeirsScreen() {
  const { t, locale } = useStrings("heirs")
  // Only for the eight relation labels. `heirs.list` returns the stored
  // English key — see `relations.ts` — so the card has to translate it.
  const { t: fields } = useStrings("heirs/new")
  const heirs = useQuery(api.heirs.list)
  const [searching, setSearching] = useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<HeirFilter | null>(null)

  const heirForms: CountForms = {
    zero: t.countZero,
    one: t.countOne,
    two: t.countTwo,
    few: t.countFew,
    many: t.countMany,
  }

  if (heirs !== undefined && heirs.length === 0) {
    // `gap-header`, matching ٤.١b exactly. `ListEmpty` returns a fragment, so
    // its blocks are direct children of this container and the gap between
    // title, lede, ghosts and CTA comes from here — without it the two empty
    // screens space differently for no reason a reader could name.
    return (
      <Screen contentClassName="gap-header">
        {/* The empty list keeps a full-width button rather than the FAB: it is
            the only action on an otherwise blank screen, and a round button in
            the corner of one reads as an afterthought. Same call as ٤.١'s. */}
        <ListEmpty
          title={t.title}
          subtitle={t.emptySubtitle!}
          lead={t.emptyLead!}
          addLabel={t.add!}
          onAdd={() => router.push("/heirs/new")}
        />
      </Screen>
    )
  }

  const count = heirs?.length ?? 0
  const all = heirs ?? []

  // Counted from the whole list, never the filtered view, so a chip's number
  // does not change as you narrow — the same rule the vault follows.
  const noAssets = all.filter((heir) => heir.routedAssetCount === 0).length
  const chips: FilterChip<HeirFilter>[] = [
    { key: null, label: t.filterAll!, count },
    ...(noAssets > 0
      ? [
          {
            key: "noAssets" as const,
            label: t.filterNoAssets!,
            count: noAssets,
            urgent: true,
          },
        ]
      : []),
    ...RELATIONS.map(([relation]) => ({
      key: relation,
      label: t[RELATION_FILTER_LABEL[relation]]!,
      count: all.filter((heir) => heir.relation === relation).length,
    })),
  ]

  const query = search.trim().toLowerCase()
  const rows = all.filter((heir) => {
    if (filter === "noAssets" && heir.routedAssetCount !== 0) return false
    if (filter !== null && filter !== "noAssets" && heir.relation !== filter) {
      return false
    }
    if (query === "") return true
    // The relation is matched in the reader's language, since that is the
    // word they see on the card and will type.
    return (
      heir.name.toLowerCase().includes(query) ||
      relationLabel(heir.relation, fields).toLowerCase().includes(query)
    )
  })

  return (
    <Screen
      contentClassName="gap-header"
      float={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.add}
          onPress={() => router.push("/heirs/new")}
          className="bg-primary active:bg-terracotta-600 size-14 items-center justify-center rounded-full shadow-md"
        >
          <Icon as={Plus} size={26} strokeWidth={2.75} className="text-background" />
        </Pressable>
      }
    >
      {/* ٤.١'s header block exactly: a quiet count over a 19px name, one 40px
          circle at the far end. */}
      <View className="flex-row items-center gap-3">
        <View className="min-w-0 flex-1">
          {heirs !== undefined ? (
            <Text variant="metaSm">
              {fmtCount(count, fmtNum(count, locale), heirForms, locale)}
            </Text>
          ) : null}
          <Text variant="pageTitle">{t.title}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.searchPlaceholder}
          onPress={() => setSearching((was) => !was)}
          className="size-10 shrink-0 items-center justify-center rounded-full bg-card active:bg-sand-300"
        >
          <Icon as={Search} size={18} strokeWidth={2.75} className="text-foreground" />
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

      {/* A filter or a search can empty a list that is not empty — different
          state, different words, as on the vault. */}
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

      <View className="gap-row mb-auto">
        {rows.map((heir) => (
          <HeirCard
            key={heir.id}
            name={heir.name}
            relation={`${relationLabel(heir.relation, fields)} · ${fmtPhoneMasked(heir.phone)}`}
            locale={locale}
            labels={{ receivesNothing: t.receivesNothing }}
            receivesSummary={
              heir.routedAssetCount === 0
                ? undefined
                : `${t.receives.replace("{n}", fmtNum(heir.routedAssetCount, locale))}${
                    heir.messageKind === null ? "" : ` · ${t.withMessage}`
                  }`
            }
            onPress={() =>
              router.push({
                pathname: "/heirs/[id]/preview",
                params: { id: heir.id },
              })
            }
          />
        ))}
      </View>
    </Screen>
  )
}
