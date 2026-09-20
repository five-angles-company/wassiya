"use client"

import { useMemo } from "react"
import Link from "next/link"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  createColumnHelper,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import type { FunctionReturnType } from "convex/server"
import { useQuery } from "convex/react"
import { ScrollTextIcon } from "lucide-react"
import { parseAsBoolean, useQueryState } from "nuqs"

import { DataTable } from "@/components/data-table"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { FacetedFilter } from "@/components/data-table-faceted-filter"
import { useLocale } from "@/components/locale-provider"
import { HEIRS } from "@/features/heirs/strings/heirs"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"
import { useLastLoaded } from "@/lib/use-last-loaded"
import { useTableUrlState } from "@/lib/use-table-url-state"

type HeirRow = FunctionReturnType<typeof api.admin.heirsPage>["page"][number]

const DEFAULT_SORTING: SortingState = [{ id: "addedAt", desc: true }]

/** The one column the server can order by. */
const SORTABLE = ["addedAt"] as const

const helper = createColumnHelper<DataTableFeatures, HeirRow>()

function heirColumns(locale: Locale): ColumnDef<DataTableFeatures, HeirRow>[] {
  const labels = t(HEIRS, locale)

  return helper.columns([
    helper.accessor("name", {
      id: "heir",
      enableSorting: false,
      header: () => labels.colHeir,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.relation} ·{" "}
            <span dir="ltr" className="inline-block">
              {row.original.phone}
            </span>
          </span>
        </div>
      ),
    }),

    helper.accessor("ownerName", {
      id: "owner",
      enableSorting: false,
      header: () => labels.colOwner,
      cell: ({ row }) => (
        <Link
          href={`/owners/${row.original.ownerId}`}
          className="flex flex-col hover:underline"
        >
          <span>{row.original.ownerName}</span>
          <span
            dir="ltr"
            className="inline-block text-xs text-muted-foreground"
          >
            {row.original.ownerEmail}
          </span>
        </Link>
      ),
    }),

    // The column this screen exists for. An heir who receives nothing is the
    // commonest silent failure in the product: the owner added them and
    // believes they are provided for.
    helper.accessor("receivesCount", {
      id: "receives",
      enableSorting: false,
      header: () => labels.colReceives,
      cell: ({ row }) => {
        const { receivesCount, sharedCount } = row.original
        if (receivesCount === 0) {
          return <Badge variant="destructive">{labels.receivesNothing}</Badge>
        }
        return (
          <span className="flex flex-col">
            <span className="tabular-nums">
              {labels.receives.replace("{n}", String(receivesCount))}
            </span>
            {sharedCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {labels.receivesShared.replace("{n}", String(sharedCount))}
              </span>
            )}
          </span>
        )
      },
    }),

    helper.accessor("addedAt", {
      id: "addedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colAdded} />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {fmtDate(row.original.addedAt, locale)}
        </span>
      ),
    }),
  ])
}

/**
 * Every heir, across every account.
 *
 * A global heir list earns a screen because of one column: what each would
 * actually receive. The name and relation are already on the owner's own page;
 * **which heirs would receive nothing** is a question no other screen asks, and
 * it is the product's commonest silent failure.
 *
 * Two things this screen is honest about rather than hiding. The routing filter
 * is applied *after* the count, because the count takes two indexed probes per
 * row and cannot be an index range — so a filtered page can come back short,
 * and `isDone` rather than a row count is what says whether another follows.
 * And the total counts every heir, not the filtered set, because producing the
 * filtered number would mean running those probes across the whole table.
 *
 * Search matches the **owner**, not the heir. `heirs` has nothing worth
 * indexing of its own, and denormalising an owner onto every heir row would go
 * stale the first time somebody changed their name — so the term resolves
 * against `users.search_owner` and narrows this stream by `userId`.
 */
export function HeirsBrowser() {
  const locale = useLocale()
  const labels = useMemo(() => t(HEIRS, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])

  const [unroutedOnly, setUnroutedOnly] = useQueryState(
    "unrouted",
    parseAsBoolean.withDefault(false)
  )
  const url = useTableUrlState({
    defaultSorting: DEFAULT_SORTING,
    sortableIds: SORTABLE,
    facetKey: String(unroutedOnly),
  })

  const { data: page, loading } = useLastLoaded(
    useQuery(api.admin.heirsPage, {
      unroutedOnly,
      search: url.search,
      sort: url.sorting[0]?.desc === false ? "oldest" : "newest",
      paginationOpts: { numItems: url.pageSize, cursor: url.cursor },
    })
  )
  const { data: tally } = useLastLoaded(useQuery(api.admin.heirsTally, {}))

  const columns = useMemo(() => heirColumns(locale), [locale])
  const columnLabels = useMemo(
    () => ({
      heir: labels.colHeir,
      owner: labels.colOwner,
      receives: labels.colReceives,
      addedAt: labels.colAdded,
    }),
    [labels]
  )
  const routingSelection = useMemo(
    () => new Set<string>(unroutedOnly ? ["unrouted"] : []),
    [unroutedOnly]
  )

  if (page === undefined) {
    return <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
  }

  return (
    <DataTable<HeirRow>
      columns={columns}
      data={page.page}
      busy={loading}
      fill
      searchPlaceholder={labels.searchPlaceholder}
      labels={tableLabels}
      locale={locale}
      columnLabels={columnLabels}
      getRowId={(row) => row.id}
      filters={
        <FacetedFilter
          title={labels.filterRouting}
          options={[{ value: "unrouted", label: labels.unroutedOnly }]}
          selected={routingSelection}
          onToggle={(_value, checked) => void setUnroutedOnly(checked)}
          onClear={() => void setUnroutedOnly(false)}
          count={() => undefined}
          clearLabel={tableLabels.resetFilters}
        />
      }
      server={{
        search: url.searchInput,
        onSearchChange: url.setSearch,
        sorting: url.sorting,
        onSortingChange: url.setSorting,
        // Owner matches are ranked by the search index, but the heirs stream
        // itself is still ordered by creation — so the sort headers keep working.
        sortLocked: false,
        page: url.pageNumber,
        pageSize: url.pageSize,
        onPageSizeChange: url.setPageSize,
        canPrev: url.canPrev,
        canNext: !page.isDone,
        onPrev: url.prevPage,
        onNext: () => url.nextPage(page.continueCursor),
        total: tally,
        loading,
      }}
      empty={
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <ScrollTextIcon className="size-6 text-muted-foreground" />
          <p className="font-medium">{labels.empty}</p>
          <p className="text-sm text-muted-foreground">{labels.emptyHint}</p>
        </div>
      }
    />
  )
}
