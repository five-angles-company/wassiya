/**
 * ٥.١ — الأوصياء. The people who receive everything the owner hands over.
 *
 * The per-executor sheet line is the one thing here that can be silently
 * wrong: an executor with no printed sheet can open nothing at release. It is
 * also the only urgent chip. The card opens ٥.٢b, where the sheet is printed.
 */
import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ExecutorCard } from "@workspace/ui-native/components/wassiya/executor-card"
import { fmtDate, fmtNum, fmtPhoneMasked } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { Plus, Search } from "lucide-react-native"
import { Pressable, View } from "react-native"

import { FilterChips, type FilterChip } from "@/components/filter-chips"
import { ListEmpty } from "@/components/list-empty"
import { Screen } from "@/components/screen"
import { SearchField } from "@/components/search-field"
import { fmtCount, type CountForms } from "@/i18n/plural"
import { useStrings } from "@/i18n/use-strings"

type ExecutorFilter = "noSheet"

export function ExecutorsScreen() {
  const { t, locale } = useStrings("executors")
  const executors = useQuery(api.executors.list)
  const [searching, setSearching] = useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<ExecutorFilter | null>(null)

  const forms: CountForms = {
    zero: t.countZero,
    one: t.countOne,
    two: t.countTwo,
    few: t.countFew,
    many: t.countMany,
  }

  if (executors !== undefined && executors.length === 0) {
    return (
      <Screen contentClassName="gap-header">
        <ListEmpty
          title={t.title}
          subtitle={t.emptySubtitle!}
          lead={t.emptyLead!}
          addLabel={t.add!}
          onAdd={() => router.push("/executors/new")}
        />
      </Screen>
    )
  }

  const all = executors ?? []
  const count = all.length
  // Counted from the whole list, so a chip's number does not change as you
  // narrow — the same rule the vault follows.
  const noSheet = all.filter((row) => row.sheetPrintedAt === null).length
  const chips: FilterChip<ExecutorFilter>[] = [
    { key: null, label: t.filterAll!, count },
    ...(noSheet > 0
      ? [{ key: "noSheet" as const, label: t.filterNoSheet!, count: noSheet, urgent: true }]
      : []),
  ]

  const query = search.trim().toLowerCase()
  const rows = all.filter((row) => {
    if (filter === "noSheet" && row.sheetPrintedAt !== null) return false
    return query === "" || row.name.toLowerCase().includes(query)
  })

  return (
    <Screen
      contentClassName="gap-header"
      float={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.add}
          onPress={() => router.push("/executors/new")}
          className="bg-primary active:bg-terracotta-600 size-14 items-center justify-center rounded-full shadow-md"
        >
          <Icon as={Plus} size={26} strokeWidth={2.75} className="text-background" />
        </Pressable>
      }
    >
      <View className="flex-row items-center gap-3">
        <View className="min-w-0 flex-1">
          {executors !== undefined ? (
            <Text variant="metaSm">
              {fmtCount(count, fmtNum(count, locale), forms, locale)}
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

      <Text variant="prose" className="text-muted-foreground">
        {t.howItWorks}
      </Text>

      {searching ? (
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder={t.searchPlaceholder!}
          clearLabel={t.clearFilters!}
        />
      ) : null}

      {count > 1 || noSheet > 0 ? (
        <FilterChips chips={chips} selected={filter} onSelect={setFilter} />
      ) : null}

      {rows.length === 0 ? (
        <View className="gap-2 pt-2">
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

      <View className="gap-row">
        {rows.map((row) => (
          <ExecutorCard
            key={row.id}
            name={row.name}
            detail={fmtPhoneMasked(row.phone)}
            locale={locale}
            labels={{ noSheet: t.noSheet }}
            sheetSummary={
              row.sheetPrintedAt === null
                ? undefined
                : t.sheetPrinted!.replace(
                    "{date}",
                    fmtDate(new Date(row.sheetPrintedAt), locale)
                  )
            }
            onPress={() =>
              router.push({
                pathname: "/executors/[id]/edit",
                params: { id: row.id },
              })
            }
          />
        ))}
      </View>

      <Text variant="metaSm" className="mb-auto text-muted-foreground">
        {t.lossNotice}
      </Text>
    </Screen>
  )
}
