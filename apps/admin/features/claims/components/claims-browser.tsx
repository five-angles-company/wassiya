"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"
import { InboxIcon } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { FacetedFilter } from "@/components/data-table-faceted-filter"
import { useLocale } from "@/components/locale-provider"
import {
  claimBrowserColumnLabels,
  claimBrowserColumns,
  type BrowsedClaim,
} from "@/features/claims/components/claims-browser-columns"
import { useClaimQueryState } from "@/features/claims/lib/use-claim-query-state"
import {
  CLAIM_STATUSES,
  claimStatusLabel,
  type ClaimStatus,
} from "@/features/claims/lib/status"
import { CLAIMS } from "@/features/claims/strings/claims"
import { fmtDate, fmtTally } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { useLastLoaded } from "@/lib/use-last-loaded"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"

/**
 * The claims workspace: every status, not just the reviewable one. The
 * dashboard's preview reads `claims.pendingReview`, which is `submitted`-only,
 * so an admin who ruled on a claim watched it leave the only admin query that
 * returns a claim id with no way back to it.
 *
 * Search, the status filter, the sort and the paging are all query arguments, so
 * a search reaches every claim rather than the hundred that happened to load.
 * Two consequences the UI carries rather than hides: cursor pagination has no
 * total, so the pager says "page 3" and takes a bounded count from `claimsTally`
 * (`500+` past the cap); and a Convex search ranks its results in an order that
 * cannot be replaced, so while a term is live the sort headers go inert and the
 * toolbar says why.
 */
export function ClaimsBrowser() {
  const locale = useLocale()
  const router = useRouter()
  // Memoised, not because resolving a dictionary is expensive but because `t`
  // returns a fresh object every call. Left bare, the `columns` memo below
  // would see new deps on every render and rebuild the column defs each time —
  // and new columns invalidate the table's models, which is the one thing
  // TanStack's own guidance says to keep stable.
  const labels = useMemo(() => t(CLAIMS, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])

  const query = useClaimQueryState()
  const { filters, cursor, pageSize } = query

  const overview = useQuery(api.admin.overview)
  // Kept, not replaced: a filter change is a new subscription, so `useQuery`
  // answers `undefined` for a moment. Rendering that directly used to unmount
  // the whole table — see `useLastLoaded`.
  const { data: page, loading } = useLastLoaded(
    useQuery(api.admin.claimsPage, {
      ...filters,
      paginationOpts: { numItems: pageSize, cursor },
    })
  )
  const { data: tally } = useLastLoaded(
    useQuery(api.admin.claimsTally, filters)
  )

  // A page that came back shorter than asked for still has `isDone` to say
  // whether another exists — so "can go forward" is that, never a row count.
  // Read off the kept page, so stepping forward is not disabled mid-refresh.
  const canNext = page !== undefined && !page.isDone

  const columns = useMemo(
    () => claimBrowserColumns(locale, tableLabels),
    [locale, tableLabels]
  )
  const columnLabels = useMemo(() => claimBrowserColumnLabels(locale), [locale])

  const statusFilter = (
    <FacetedFilter
      title={labels.colStatus}
      options={CLAIM_STATUSES.map((value) => ({
        value,
        label: claimStatusLabel(value, locale),
      }))}
      selected={new Set<string>(filters.statuses)}
      onToggle={query.toggleStatus}
      onClear={query.clearStatuses}
      // True totals from `overview`, not a count of what was loaded. These are
      // unfiltered per-status tallies, which is what makes them useful for
      // *choosing* a status rather than describing the current page.
      count={(value) => {
        const row = overview?.claims[value as ClaimStatus]
        return row === undefined ? undefined : fmtTally(row, locale)
      }}
      clearLabel={tableLabels.resetFilters}
    />
  )

  // Only the very first load, when there is genuinely nothing to show yet.
  if (page === undefined) {
    return <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
  }

  return (
    <DataTable<BrowsedClaim>
      columns={columns}
      data={page.page}
      busy={loading}
      labels={tableLabels}
      locale={locale}
      columnLabels={columnLabels}
      getRowId={(row) => row.id}
      fill
      filters={statusFilter}
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
        canNext,
        onPrev: query.prevPage,
        onNext: () => query.nextPage(page.continueCursor),
        total: tally,
        loading,
      }}
      onRowClick={(row) => router.push(`/claims/${row.id}`)}
      bulk={{
        exportName: "claims",
        rowId: (row) => row.id,
        csvColumns: [
          { header: "id", value: (row) => row.id },
          { header: labels.colStatus, value: (row) => row.status },
          { header: labels.colClaimant, value: (row) => row.claimantName },
          { header: labels.contactLabel, value: (row) => row.claimantContact },
          { header: labels.colOwner, value: (row) => row.subjectVerifiedName },
          {
            header: labels.certificateNameLabel,
            value: (row) => row.certificateName,
          },
          {
            header: labels.colSubmitted,
            value: (row) => fmtDate(row.submittedAt, locale),
          },
        ],
      }}
      empty={
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <InboxIcon className="size-6 text-muted-foreground" />
          <p className="font-medium">{labels.empty}</p>
          <p className="text-sm text-muted-foreground">{labels.emptyHint}</p>
        </div>
      }
    />
  )
}
