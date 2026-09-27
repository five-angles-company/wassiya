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
import { Text } from "@workspace/ui-native/components/ui/text"
import { ExecutorCard } from "@workspace/ui-native/components/wassiya/executor-card"
import {
  fmtDate,
  fmtNum,
  fmtPhoneMasked,
} from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { Search, Users } from "lucide-react-native"
import { View } from "react-native"

import { AddFab } from "@/components/add-fab"
import { EmptyTab } from "@/components/empty-tab"
import { FilterChips, type FilterChip } from "@/components/filter-chips"
import { IconButton } from "@/components/icon-button"
import { NoResults } from "@/components/no-results"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
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

  const all = executors ?? []
  const count = all.length
  const empty = executors !== undefined && count === 0
  const add = () => router.push("/executors/new")

  // One header for both states, so adding the first executor changes the
  // list under it and nothing above.
  const header = (
    <ScreenHeader
      eyebrow={
        executors === undefined
          ? undefined
          : fmtCount(count, fmtNum(count, locale), forms, locale)
      }
      title={t.title!}
      description={empty ? undefined : t.howItWorks}
      trailing={
        empty ? undefined : (
          <IconButton
            icon={Search}
            label={t.searchPlaceholder!}
            onPress={() => setSearching((was) => !was)}
          />
        )
      }
    />
  )

  if (empty) {
    return (
      <Screen>
        {header}
        <EmptyTab
          icon={Users}
          title={t.emptyTitle!}
          body={t.emptyLead!}
          actionLabel={t.add!}
          onAction={add}
          footnote={t.lossNotice}
        />
      </Screen>
    )
  }

  // Counted from the whole list, so a chip's number does not change as you
  // narrow — the same rule the vault follows.
  const noSheet = all.filter((row) => row.sheetPrintedAt === null).length
  const chips: FilterChip<ExecutorFilter>[] = [
    { key: null, label: t.filterAll!, count },
    ...(noSheet > 0
      ? [
          {
            key: "noSheet" as const,
            label: t.filterNoSheet!,
            count: noSheet,
            urgent: true,
          },
        ]
      : []),
  ]

  const query = search.trim().toLowerCase()
  const rows = all.filter((row) => {
    if (filter === "noSheet" && row.sheetPrintedAt !== null) return false
    return query === "" || row.name.toLowerCase().includes(query)
  })

  return (
    <Screen float={<AddFab label={t.add!} onPress={add} />}>
      {header}
      <View className="gap-header grow">
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

        <Text variant="metaSm" className="mb-auto">
          {t.lossNotice}
        </Text>
      </View>
    </Screen>
  )
}
