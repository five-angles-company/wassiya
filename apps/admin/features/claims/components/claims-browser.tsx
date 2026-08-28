"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { useQuery } from "convex/react"
import { InboxIcon } from "lucide-react"

import { DataTable, type DataTableFacet } from "@/components/data-table"
import { useLocale } from "@/components/locale-provider"
import {
  claimBrowserColumnLabels,
  claimBrowserColumns,
  type BrowsedClaim,
} from "@/features/claims/components/claims-browser-columns"
import {
  CLAIM_STATUSES,
  claimStatusLabel,
  type ClaimStatus,
} from "@/features/claims/lib/status"
import { CLAIMS } from "@/features/claims/strings/claims"
import {
  IDENTITY_STATUSES,
  identityLabel,
} from "@/features/claims/lib/identity"
import { fmtDate, fmtTally } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"

/**
 * The claims workspace: every status, not just the reviewable one.
 *
 * The dashboard's preview reads `claims.pendingReview`, which is
 * `submitted`-only — and that single fact is what made review unusable. An
 * admin who ruled on a claim watched it leave the only admin query that returns
 * a claim id, with no way back to it. This browser exists so acting on a claim
 * does not lose it.
 *
 * ## Status is a server filter; everything else is a client filter
 *
 * The chips change the **query argument**, so each one fetches its own slice of
 * up to 100 rows. Status therefore cannot also be a faceted column: faceting
 * runs over the rows already loaded, and inside one status slice every row has
 * the same status, so the facet would offer a single value that filters
 * nothing.
 *
 * Identity and heir-linkage genuinely vary within a slice, so those are facets.
 * The division is not stylistic — it is where the data actually lives.
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
  const [status, setStatus] = useState<ClaimStatus>("submitted")

  const overview = useQuery(api.admin.overview)
  const page = useQuery(api.admin.claimsByStatus, { status })

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {CLAIM_STATUSES.map((option) => {
          const active = option === status
          const tally = overview?.claims[option]
          return (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={active ? "secondary" : "outline"}
              onClick={() => setStatus(option)}
              className={cn(!active && "text-muted-foreground")}
            >
              {claimStatusLabel(option, locale)}
              {tally !== undefined && (
                <span className="tabular-nums opacity-70">
                  {fmtTally(tally, locale)}
                </span>
              )}
            </Button>
          )
        })}
      </div>

      {page === undefined ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        // No `TableCard` here, unlike the dashboard's preview. That card draws
        // its own border and pads to zero so a bare table can sit flush inside
        // it — which is right for five rows and wrong for a table that brings a
        // toolbar and a pager of its own. The chips above already say which
        // slice this is, so a title would only repeat them.
        <DataTable<BrowsedClaim>
          columns={columns}
          data={page.rows}
          labels={tableLabels}
          locale={locale}
          columnLabels={columnLabels}
          getRowId={(row) => row.id}
          facets={facets}
          initialPageSize={25}
          // Only when the server actually truncated. Passing it
          // unconditionally would put a permanent warning on a nine-row
          // table, and a warning that is always on is one nobody reads.
          capped={page.more ? { cap: page.pageSize } : undefined}
          onRowClick={(row) => router.push(`/claims/${row.id}`)}
          bulk={{
            exportName: `claims-${status}`,
            rowId: (row) => row.id,
            csvColumns: [
              { header: "id", value: (row) => row.id },
              { header: labels.colStatus, value: (row) => row.status },
              { header: labels.colClaimant, value: (row) => row.claimantName },
              {
                header: labels.contactLabel,
                value: (row) => row.claimantContact,
              },
              {
                header: labels.colIdentity,
                value: (row) => row.claimantIdentityStatus,
              },
              {
                header: labels.colOwner,
                value: (row) => row.subjectVerifiedName,
              },
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
              <p className="text-sm text-muted-foreground">
                {labels.emptyHint}
              </p>
            </div>
          }
        />
      )}
    </div>
  )
}
