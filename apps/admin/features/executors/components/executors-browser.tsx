"use client"

import { useMemo } from "react"
import Link from "next/link"
import { api } from "@workspace/backend/api"
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
import { EXECUTORS } from "@/features/executors/strings/executors"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtDate, fmtNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"
import { useLastLoaded } from "@/lib/use-last-loaded"
import { useTableUrlState } from "@/lib/use-table-url-state"

type ExecutorRow = FunctionReturnType<
  typeof api.admin.executorsPage
>["page"][number]

const DEFAULT_SORTING: SortingState = [{ id: "addedAt", desc: true }]

/** The one column the server can order by. */
const SORTABLE = ["addedAt"] as const

const helper = createColumnHelper<DataTableFeatures, ExecutorRow>()

function executorColumns(
  locale: Locale
): ColumnDef<DataTableFeatures, ExecutorRow>[] {
  const labels = t(EXECUTORS, locale)

  return helper.columns([
    helper.accessor("name", {
      id: "executor",
      enableSorting: false,
      header: () => labels.colExecutor,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    }),

    helper.accessor("phone", {
      id: "phone",
      enableSorting: false,
      header: () => labels.colPhone,
      cell: ({ row }) => (
        <span dir="ltr" className="inline-block tabular-nums">
          {row.original.phone}
        </span>
      ),
    }),

    helper.accessor("email", {
      id: "email",
      enableSorting: false,
      header: () => labels.colEmail,
      cell: ({ row }) =>
        row.original.email === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span dir="ltr" className="inline-block">
            {row.original.email}
          </span>
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

    // Without a printed sheet a release reaches this executor with nothing to
    // open it — only the owner's own recovery sheet could stand in.
    helper.accessor("sheetPrintedAt", {
      id: "sheet",
      enableSorting: false,
      header: () => labels.colSheet,
      cell: ({ row }) => {
        const { sheetPrintedAt, sheetVersion } = row.original
        if (sheetPrintedAt === null) {
          return <span className="text-destructive">{labels.sheetNone}</span>
        }
        return (
          <span className="whitespace-nowrap tabular-nums">
            {labels.sheetPrinted
              .replace("{date}", fmtDate(sheetPrintedAt, locale))
              .replace("{version}", fmtNumber(sheetVersion ?? 0, locale))}
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
 * Every executor, across every account.
 *
 * The total counts every executor, not the filtered set, so a filtered page
 * can come back short: `isDone`, not a row count, says whether another follows.
 *
 * Search matches the **owner**, not the executor — the term resolves against
 * `users.search_owner` and narrows this stream by `userId`.
 */
export function ExecutorsBrowser() {
  const locale = useLocale()
  const labels = useMemo(() => t(EXECUTORS, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])

  const [withoutSheetOnly, setWithoutSheetOnly] = useQueryState(
    "noSheet",
    parseAsBoolean.withDefault(false)
  )
  const url = useTableUrlState({
    defaultSorting: DEFAULT_SORTING,
    sortableIds: SORTABLE,
    facetKey: String(withoutSheetOnly),
  })

  const { data: page, loading } = useLastLoaded(
    useQuery(api.admin.executorsPage, {
      withoutSheetOnly,
      search: url.search,
      sort: url.sorting[0]?.desc === false ? "oldest" : "newest",
      paginationOpts: { numItems: url.pageSize, cursor: url.cursor },
    })
  )
  const { data: tally } = useLastLoaded(useQuery(api.admin.executorsTally, {}))

  const columns = useMemo(() => executorColumns(locale), [locale])
  const columnLabels = useMemo(
    () => ({
      executor: labels.colExecutor,
      phone: labels.colPhone,
      email: labels.colEmail,
      owner: labels.colOwner,
      sheet: labels.colSheet,
      addedAt: labels.colAdded,
    }),
    [labels]
  )
  const sheetSelection = useMemo(
    () => new Set<string>(withoutSheetOnly ? ["noSheet"] : []),
    [withoutSheetOnly]
  )

  if (page === undefined) {
    return <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
  }

  return (
    <DataTable<ExecutorRow>
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
          title={labels.filterSheet}
          options={[{ value: "noSheet", label: labels.withoutSheetOnly }]}
          selected={sheetSelection}
          onToggle={(_value, checked) => void setWithoutSheetOnly(checked)}
          onClear={() => void setWithoutSheetOnly(false)}
          count={() => undefined}
          clearLabel={tableLabels.resetFilters}
        />
      }
      server={{
        search: url.searchInput,
        onSearchChange: url.setSearch,
        sorting: url.sorting,
        onSortingChange: url.setSorting,
        // Owner matches are ranked by the search index, but the executors
        // stream itself is still ordered by creation — the sort keeps working.
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
