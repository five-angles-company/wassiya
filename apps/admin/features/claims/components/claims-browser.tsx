"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"
import { InboxIcon } from "lucide-react"

import { DataTable, type DataTableFacet } from "@/components/data-table"
import { FacetedFilter } from "@/components/data-table-faceted-filter"
import { useLocale } from "@/components/locale-provider"
import {
  claimBrowserColumnLabels,
  claimBrowserColumns,
  type BrowsedClaim,
} from "@/features/claims/components/claims-browser-columns"
import {
  IDENTITY_STATUSES,
  identityLabel,
} from "@/features/claims/lib/identity"
import {
  CLAIM_STATUSES,
  claimStatusLabel,
  type ClaimStatus,
} from "@/features/claims/lib/status"
import { CLAIMS } from "@/features/claims/strings/claims"
import { fmtDate, fmtTally } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"

/** Selecting nothing means no constraint, which the query reads as all six. */
const NO_STATUS_FILTER: ClaimStatus[] = []

/**
 * What the workspace opens on.
 *
 * `submitted` rather than everything, which is what the chips defaulted to and
 * is still the console's actual job: it is the only status with a decision in
 * front of it. Opening on all six would bury four claims that need a reviewer
 * under months of terminal ones, and would fetch six index ranges to do it.
 *
 * Safe as a default because it is *visible* as one — the filter shows a count
 * badge and every loaded row says `submitted` in its status column, so nobody
 * mistakes a filtered view for the whole table.
 */
const DEFAULT_STATUSES: ClaimStatus[] = ["submitted"]

/**
 * The claims workspace: every status, not just the reviewable one.
 *
 * The dashboard's preview reads `claims.pendingReview`, which is
 * `submitted`-only — and that single fact is what made review unusable. An
 * admin who ruled on a claim watched it leave the only admin query that returns
 * a claim id, with no way back to it. This browser exists so acting on a claim
 * does not lose it.
 *
 * ## Status is a filter like the others, applied a layer lower
 *
 * It used to be a row of chips above the table — a second filtering idiom
 * sitting above the real one, and single-select where its neighbours were
 * multi. It is now the first control in the toolbar and reads identically to
 * them, but it still drives the **query argument** rather than a column filter,
 * because that is where it has to happen: faceting runs over rows already
 * loaded, so a status facet could only ever offer the statuses already fetched.
 *
 * The consequence to keep in mind is the cap. `claimsByStatus` takes 100 rows
 * **per status**, so ticking all six can load six hundred and truncate each
 * independently — which is why the query names the statuses it truncated rather
 * than answering a single `more` boolean.
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

  const [statuses, setStatuses] = useState<ClaimStatus[]>(DEFAULT_STATUSES)

  const overview = useQuery(api.admin.overview)
  const page = useQuery(api.admin.claimsByStatus, { statuses })

  const columns = useMemo(
    () => claimBrowserColumns(locale, tableLabels),
    [locale, tableLabels]
  )
  const columnLabels = useMemo(() => claimBrowserColumnLabels(locale), [locale])

  const facets = useMemo<DataTableFacet[]>(
    () => [
      {
        columnId: "claimantIdentityStatus",
        title: labels.colIdentity,
        options: IDENTITY_STATUSES.map((value) => ({
          value,
          label: identityLabel(value, locale),
        })),
      },
      {
        columnId: "heirLinked",
        title: labels.colHeir,
        options: [
          { value: "linked", label: labels.heirLinked },
          { value: "unlinked", label: labels.heirNotLinked },
        ],
      },
    ],
    [labels, locale]
  )

  const toggleStatus = useCallback((value: string, checked: boolean) => {
    setStatuses((current) => {
      const next = new Set(current)
      if (checked) next.add(value as ClaimStatus)
      else next.delete(value as ClaimStatus)
      return [...next]
    })
  }, [])

  const statusFilter = (
    <FacetedFilter
      title={labels.colStatus}
      options={CLAIM_STATUSES.map((value) => ({
        value,
        label: claimStatusLabel(value, locale),
      }))}
      selected={new Set<string>(statuses)}
      onToggle={toggleStatus}
      onClear={() => setStatuses(NO_STATUS_FILTER)}
      // True totals from `overview`, not a count of what was loaded. An
      // unticked status has fetched nothing, so a loaded-row count would read
      // zero against every one of them and make the filter look empty.
      count={(value) => {
        const tally = overview?.claims[value as ClaimStatus]
        return tally === undefined ? undefined : fmtTally(tally, locale)
      }}
      clearLabel={tableLabels.resetFilters}
    />
  )

  if (page === undefined) {
    return <Skeleton className="h-96 w-full rounded-xl" />
  }

  const capped =
    page.cappedStatuses.length > 0
      ? {
          cap: page.pageSize,
          detail: tableLabels.cappedSearchDetail
            .replace("{n}", String(page.pageSize))
            .replace(
              "{statuses}",
              page.cappedStatuses
                .map((status) => claimStatusLabel(status as ClaimStatus, locale))
                .join(locale === "ar" ? "، " : ", ")
            ),
        }
      : undefined

  return (
    <DataTable<BrowsedClaim>
      columns={columns}
      data={page.rows}
      labels={tableLabels}
      locale={locale}
      columnLabels={columnLabels}
      getRowId={(row) => row.id}
      filters={statusFilter}
      facets={facets}
      initialPageSize={25}
      capped={capped}
      onRowClick={(row) => router.push(`/claims/${row.id}`)}
      bulk={{
        exportName: "claims",
        rowId: (row) => row.id,
        csvColumns: [
          { header: "id", value: (row) => row.id },
          { header: labels.colStatus, value: (row) => row.status },
          { header: labels.colClaimant, value: (row) => row.claimantName },
          { header: labels.contactLabel, value: (row) => row.claimantContact },
          {
            header: labels.colIdentity,
            value: (row) => row.claimantIdentityStatus,
          },
          { header: labels.colOwner, value: (row) => row.subjectVerifiedName },
          {
            header: labels.certificateNameLabel,
            value: (row) => row.certificateName,
          },
          {
            header: labels.colHeir,
            value: (row) =>
              row.heirLinked ? labels.heirLinked : labels.heirNotLinked,
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
