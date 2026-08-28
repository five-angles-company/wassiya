"use client"

import { useMemo } from "react"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"
import { ShieldCheckIcon } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { FacetedFilter } from "@/components/data-table-faceted-filter"
import { useLocale } from "@/components/locale-provider"
import {
  identityColumnLabels,
  identityColumns,
  type IdentityRow,
} from "@/features/identity/components/identity-columns"
import { useIdentityQueryState } from "@/features/identity/lib/use-identity-query-state"
import { IDENTITY } from "@/features/identity/strings/identity"
import { IDENTITY_STATUSES, identityLabel } from "@/lib/identity"
import { t } from "@/lib/i18n/locale"
import { useLastLoaded } from "@/lib/use-last-loaded"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"

/**
 * ٱلتحقق من الهوية — the accounts waiting on identity, and the ones stuck.
 *
 * ## The gap this closes
 *
 * `admin.activation` already counts owners who have burned all three Didit
 * attempts, so the dashboard could say *four are stuck* while nothing anywhere
 * could say **which four**. Meanwhile the mobile app tells exactly those people
 * to contact support, and support had no screen to find them on and no mutation
 * to unblock them with. This screen is both halves of that.
 *
 * Search is an **exact email lookup**, not a search: `users` carries an
 * equality index on email and no full-text index. The placeholder says so,
 * because a box that silently requires a whole address is otherwise reported as
 * broken the first time someone types half a name into it.
 */
export function IdentityBrowser() {
  const locale = useLocale()
  const labels = useMemo(() => t(IDENTITY, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])

  const query = useIdentityQueryState()
  const { filters, cursor, pageSize } = query

  // Kept across argument changes, so a filter toggle refreshes the table
  // instead of unmounting it — see `useLastLoaded`.
  const { data: page, loading } = useLastLoaded(
    useQuery(api.admin.identityPage, {
      ...filters,
      paginationOpts: { numItems: pageSize, cursor },
    })
  )
  const { data: tally } = useLastLoaded(
    useQuery(api.admin.identityTally, filters)
  )

  const columns = useMemo(() => identityColumns(locale), [locale])
  const columnLabels = useMemo(() => identityColumnLabels(locale), [locale])

  // Only the very first load, when there is genuinely nothing to show yet.
  if (page === undefined) {
    return <Skeleton className="h-96 w-full rounded-xl" />
  }

  return (
    <DataTable<IdentityRow>
      columns={columns}
      data={page.page}
      busy={loading}
      labels={tableLabels}
      locale={locale}
      columnLabels={columnLabels}
      getRowId={(row) => row.id}
      searchPlaceholder={labels.searchPlaceholder}
      filters={
        <>
          <FacetedFilter
            title={labels.colStatus}
            options={IDENTITY_STATUSES.map((value) => ({
              value,
              label: identityLabel(value, locale),
            }))}
            selected={query.statusSelection}
            onToggle={query.toggleStatus}
            onClear={query.clearStatuses}
            count={() => undefined}
            clearLabel={tableLabels.resetFilters}
          />
          <FacetedFilter
            title={labels.filterStuck}
            options={[{ value: "stuck", label: labels.stuckOnly }]}
            selected={query.stuckSelection}
            onToggle={query.toggleStuck}
            onClear={query.clearStuck}
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
        // Nothing ranks these rows, so the sort headers always apply.
        sortLocked: false,
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
        exportName: "identity",
        rowId: (row) => row.id,
        csvColumns: [
          { header: "id", value: (row) => row.id },
          { header: labels.colOwner, value: (row) => row.name },
          { header: "email", value: (row) => row.email },
          { header: labels.colStatus, value: (row) => row.status },
          { header: labels.colAttempts, value: (row) => row.attempts },
          { header: labels.colVerifiedName, value: (row) => row.verifiedName },
          { header: labels.colDocType, value: (row) => row.docType },
        ],
      }}
      empty={
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <ShieldCheckIcon className="size-6 text-muted-foreground" />
          <p className="font-medium">{labels.empty}</p>
          <p className="text-sm text-muted-foreground">{labels.emptyHint}</p>
        </div>
      }
    />
  )
}
