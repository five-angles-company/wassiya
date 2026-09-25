"use client"

import { useMemo, useState } from "react"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"
import { UnlockIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { DataTable } from "@/components/data-table"
import { useLocale } from "@/components/locale-provider"
import {
  bandLabel,
  releaseColumnLabels,
  releaseColumns,
  RELEASE_BANDS,
  type ReleaseRow,
} from "@/features/releases/components/releases-columns"
import { RELEASES } from "@/features/releases/strings/releases"
import { t } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"

/**
 * ٧ — the release pipeline.
 *
 * One row per death report: what is counting down to release, and what each
 * released report delivered.
 *
 * **It was two stacked panels, and that was the whole problem.** This was the
 * only screen in the console that was not a `DataTable`, so it alone had no
 * search, no column visibility, no export and two separate empty states. The
 * band is a faceted column now, which is how every other list here separates
 * kinds of row.
 *
 * Bounded rather than paginated, which the table reports through `capped`: a
 * countdown an operator pages through has stopped being a countdown.
 *
 * Expect released rows to read as failures. That is the honest state of the
 * product, and this is the only screen where it is visible.
 */
export function ReleasesTable() {
  const locale = useLocale()
  const router = useRouter()
  const labels = useMemo(() => t(RELEASES, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])

  // Once per mount: the query may not read the clock, and a countdown that
  // disagreed with itself between renders would be worse than a stale one.
  const [now] = useState(() => Date.now())
  const result = useQuery(api.admin.releasesTable, { now })

  const columns = useMemo(() => releaseColumns(locale), [locale])
  const columnLabels = useMemo(() => releaseColumnLabels(locale), [locale])

  if (result === undefined) {
    return <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
  }

  return (
    <DataTable<ReleaseRow>
      columns={columns}
      data={result.rows}
      fill
      searchPlaceholder={labels.searchPlaceholder}
      labels={tableLabels}
      locale={locale}
      columnLabels={columnLabels}
      getRowId={(row) => row.id}
      onRowClick={(row) => router.push(`/claims/${row.id}`)}
      facets={[
        {
          columnId: "band",
          title: labels.colBand,
          options: RELEASE_BANDS.map((value) => ({
            value,
            label: bandLabel(value, locale),
          })),
        },
      ]}
      capped={result.capped ? { cap: result.bandCap } : undefined}
      empty={
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <UnlockIcon className="size-6 text-muted-foreground" />
          <span className="font-medium">{labels.empty}</span>
          <span className="max-w-sm text-sm text-muted-foreground">
            {labels.emptyHint}
          </span>
        </div>
      }
      bulk={{
        exportName: "releases",
        rowId: (row) => row.id,
        csvColumns: [
          { header: "id", value: (row) => row.id },
          { header: labels.colOwner, value: (row) => row.subjectName ?? "" },
          { header: "email", value: (row) => row.subjectEmail ?? "" },
          {
            header: labels.colBand,
            value: (row) => bandLabel(row.band, locale),
          },
          { header: labels.colClaimant, value: (row) => row.claimantName },
          {
            header: labels.colDeadline,
            value: (row) => (row.vetoDeadline === null ? "" : row.vetoDeadline),
          },
          {
            header: labels.colReleased,
            value: (row) => (row.releasedAt === null ? "" : row.releasedAt),
          },
          {
            header: labels.colDelivery,
            value: (row) =>
              row.deliveries === null
                ? (row.heirsReceiving ?? "")
                : `${row.deliveries.ready}/${row.deliveries.total}`,
          },
        ],
      }}
    />
  )
}
