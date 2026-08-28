"use client"

import { useMemo } from "react"
import Link from "next/link"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import type { FunctionReturnType } from "convex/server"
import { useQuery } from "convex/react"
import { CreditCardIcon } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { FacetedFilter } from "@/components/data-table-faceted-filter"
import { useLocale } from "@/components/locale-provider"
import { useOwnerQueryState } from "@/lib/use-owner-query-state"
import { SUBSCRIPTIONS } from "@/features/subscriptions/strings/subscriptions"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtBytes, fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"
import { useLastLoaded } from "@/lib/use-last-loaded"

type Row = FunctionReturnType<typeof api.admin.ownersPage>["page"][number]

const helper = createColumnHelper<DataTableFeatures, Row>()

function subscriptionColumns(
  locale: Locale
): ColumnDef<DataTableFeatures, Row>[] {
  const labels = t(SUBSCRIPTIONS, locale)

  return helper.columns([
    helper.accessor("name", {
      id: "owner",
      enableSorting: false,
      header: () => labels.colOwner,
      cell: ({ row }) => (
        <Link
          href={`/owners/${row.original.id}`}
          className="flex flex-col hover:underline"
        >
          <span className="font-medium">{row.original.name}</span>
          <span dir="ltr" className="inline-block text-xs text-muted-foreground">
            {row.original.email}
          </span>
        </Link>
      ),
    }),

    helper.accessor("plan", {
      id: "plan",
      enableSorting: false,
      header: () => labels.colPlan,
      cell: ({ row }) =>
        row.original.plan === null ? (
          <span className="text-muted-foreground">{labels.none}</span>
        ) : (
          <Badge variant="outline">{row.original.plan}</Badge>
        ),
    }),

    helper.accessor("storageBytesUsed", {
      id: "storage",
      enableSorting: false,
      header: () => labels.colStorage,
      cell: ({ row }) => (
        <span className="tabular-nums">
          {fmtBytes(row.original.storageBytesUsed, locale)}
        </span>
      ),
    }),

    helper.accessor("joinedAt", {
      id: "joinedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colJoined} />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {fmtDate(row.original.joinedAt, locale)}
        </span>
      ),
    }),
  ])
}

/**
 * ٱلاشتراكات — the accounts list, read through the billing lens.
 *
 * **The same rows and the same query as `/owners`.** A subscription is a field
 * on a user, not a table of its own, so this screen is a saved view rather than
 * a new record: different columns, the plan filter promoted to the front, and
 * everything about identity dropped. The intro line says so, because two
 * screens showing the same rows without explaining the relationship is how an
 * operator starts wondering which one is authoritative.
 *
 * Sorting by storage is deliberately absent. `users` has no index on
 * `subscription.storageBytesUsed`, so a sort could only order the page in front
 * of you — which would look like "the biggest accounts" and be nothing of the
 * kind. The dashboard's storage panel answers that question properly.
 */
export function SubscriptionsBrowser() {
  const locale = useLocale()
  const labels = useMemo(() => t(SUBSCRIPTIONS, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])

  const query = useOwnerQueryState()
  const { filters, cursor, pageSize } = query

  const { data: page, loading } = useLastLoaded(
    useQuery(api.admin.ownersPage, {
      ...filters,
      paginationOpts: { numItems: pageSize, cursor },
    })
  )
  const { data: tally } = useLastLoaded(
    useQuery(api.admin.ownersTally, filters)
  )

  const columns = useMemo(() => subscriptionColumns(locale), [locale])
  const columnLabels = useMemo(
    () => ({
      owner: labels.colOwner,
      plan: labels.colPlan,
      storage: labels.colStorage,
      joinedAt: labels.colJoined,
    }),
    [labels]
  )

  if (page === undefined) {
    return <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
  }

  return (
    <DataTable<Row>
      columns={columns}
      data={page.page}
      busy={loading}
      fill
      labels={tableLabels}
      locale={locale}
      columnLabels={columnLabels}
      getRowId={(row) => row.id}
      filters={
        <FacetedFilter
          title={labels.colPlan}
          options={[
            { value: "free", label: "free" },
            { value: "paid", label: "paid" },
          ]}
          selected={query.planSelection}
          onToggle={query.togglePlan}
          onClear={query.clearPlans}
          count={() => undefined}
          clearLabel={tableLabels.resetFilters}
        />
      }
      server={{
        search: query.searchInput,
        onSearchChange: query.setSearch,
        sorting: query.sorting,
        onSortingChange: query.setSorting,
        sortLocked: filters.search.length > 0,
        page: query.pageNumber,
        pageSize,
        onPageSizeChange: query.setPageSize,
        canPrev: query.canPrev,
        canNext: !page.isDone,
        onPrev: query.prevPage,
        onNext: () => query.nextPage(page.continueCursor),
        total: tally,
        loading,
      }}
      bulk={{
        exportName: "subscriptions",
        rowId: (row) => row.id,
        csvColumns: [
          { header: "id", value: (row) => row.id },
          { header: labels.colOwner, value: (row) => row.name },
          { header: "email", value: (row) => row.email },
          { header: labels.colPlan, value: (row) => row.plan },
          { header: "storage bytes", value: (row) => row.storageBytesUsed },
          {
            header: labels.colJoined,
            value: (row) => fmtDate(row.joinedAt, locale),
          },
        ],
      }}
      empty={
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <CreditCardIcon className="size-6 text-muted-foreground" />
          <p className="font-medium">{labels.empty}</p>
          <p className="text-sm text-muted-foreground">{labels.emptyHint}</p>
        </div>
      }
    />
  )
}
