"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"
import { UsersIcon } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { FacetedFilter } from "@/components/data-table-faceted-filter"
import { useLocale } from "@/components/locale-provider"
import {
  ownerColumnLabels,
  ownerColumns,
  type OwnerRow,
} from "@/features/owners/components/owners-columns"
import { useOwnerQueryState } from "@/lib/use-owner-query-state"
import { OWNERS } from "@/features/owners/strings/owners"
import { IDENTITY_STATUSES, identityLabel } from "@/lib/identity"
import { fmtBytes, fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"
import { useLastLoaded } from "@/lib/use-last-loaded"

/**
 * ٱلحسابات — every owner, and the door to everything about one.
 *
 * The keystone of the Accounts group. Heirs, devices and a subscription are all
 * *per owner* and neither `heirs` nor `devices` carries an index that is not
 * `by_userId`, so they are reached through an account rather than listed
 * globally — see `admin.ownerDetail`.
 *
 * Search is a real search here, not the exact-email lookup the identity queue
 * settles for: `users` gained a `searchText` column and a search index, so a
 * name works. Ranked by match, which is why the sort headers go inert while a
 * term is live.
 */
export function OwnersBrowser() {
  const locale = useLocale()
  const router = useRouter()
  const labels = useMemo(() => t(OWNERS, locale), [locale])
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

  const columns = useMemo(() => ownerColumns(locale), [locale])
  const columnLabels = useMemo(() => ownerColumnLabels(locale), [locale])

  if (page === undefined) {
    return <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
  }

  return (
    <DataTable<OwnerRow>
      columns={columns}
      data={page.page}
      busy={loading}
      fill
      labels={tableLabels}
      locale={locale}
      columnLabels={columnLabels}
      getRowId={(row) => row.id}
      searchPlaceholder={labels.searchPlaceholder}
      filters={
        <>
          <FacetedFilter
            title={labels.colIdentity}
            options={IDENTITY_STATUSES.map((value) => ({
              value,
              label: identityLabel(value, locale),
            }))}
            selected={query.identitySelection}
            onToggle={query.toggleIdentity}
            onClear={query.clearIdentity}
            count={() => undefined}
            clearLabel={tableLabels.resetFilters}
          />
          {/* Plan names as the subscription stores them, not a guess at a
              catalogue — the seed writes "free", and anything else that
              appears here came from a real row. */}
          <FacetedFilter
            title={labels.filterPlan}
            options={[
              { value: "free", label: labels.planFree },
              { value: "paid", label: labels.planPaid },
            ]}
            selected={query.planSelection}
            onToggle={query.togglePlan}
            onClear={query.clearPlans}
            count={() => undefined}
            clearLabel={tableLabels.resetFilters}
          />
        </>
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
      onRowClick={(row) => router.push(`/owners/${row.id}`)}
      bulk={{
        exportName: "owners",
        rowId: (row) => row.id,
        csvColumns: [
          { header: "id", value: (row) => row.id },
          { header: labels.colOwner, value: (row) => row.name },
          { header: "email", value: (row) => row.email },
          { header: labels.colIdentity, value: (row) => row.identityStatus },
          { header: labels.colPlan, value: (row) => row.plan },
          { header: labels.colCountry, value: (row) => row.country },
          {
            header: labels.colStorage,
            value: (row) => fmtBytes(row.storageBytesUsed, locale),
          },
          {
            header: labels.colJoined,
            value: (row) => fmtDate(row.joinedAt, locale),
          },
        ],
      }}
      empty={
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <UsersIcon className="size-6 text-muted-foreground" />
          <p className="font-medium">{labels.empty}</p>
          <p className="text-sm text-muted-foreground">{labels.emptyHint}</p>
        </div>
      }
    />
  )
}
