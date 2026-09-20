"use client"

import { useMemo } from "react"
import type { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import type { FunctionReturnType } from "convex/server"
import { TimerIcon } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { SheetBody, SheetShell } from "@/components/sheet-shell"
import { JOBS } from "@/features/jobs/strings/jobs"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtAgo, fmtDate, fmtNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"

type Job = FunctionReturnType<typeof api.admin.jobRunsList>["jobs"][number]
type Run = Job["runs"][number]

const helper = createColumnHelper<DataTableFeatures, Run>()

function runColumns(
  locale: Locale,
  now: number
): ColumnDef<DataTableFeatures, Run>[] {
  const labels = t(JOBS, locale)

  return helper.columns([
    helper.accessor("ranAt", {
      id: "ranAt",
      enableSorting: false,
      header: () => labels.colRanAt,
      cell: ({ row }) => (
        <span className="flex flex-col">
          <span className="tabular-nums">
            {fmtAgo(row.original.ranAt, now, locale)}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {fmtDate(row.original.ranAt, locale)}
          </span>
        </span>
      ),
    }),
    helper.accessor("scanned", {
      id: "scanned",
      enableSorting: false,
      header: () => labels.colScanned,
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {fmtNumber(row.original.scanned, locale)}
        </span>
      ),
    }),
    // Emphasised only when non-zero. A column of zeroes is the healthy case
    // for a sweep, and it should read as calm rather than as failure.
    helper.accessor("changed", {
      id: "changed",
      enableSorting: false,
      header: () => labels.colChanged,
      cell: ({ row }) => (
        <span
          className={
            row.original.changed > 0
              ? "font-medium tabular-nums"
              : "text-muted-foreground tabular-nums"
          }
        >
          {fmtNumber(row.original.changed, locale)}
        </span>
      ),
    }),
    helper.display({
      id: "rescheduled",
      enableHiding: false,
      header: () => <span className="sr-only">{labels.rescheduled}</span>,
      cell: ({ row }) =>
        row.original.rescheduled ? (
          <Badge variant="outline" className="whitespace-nowrap">
            {labels.rescheduled}
          </Badge>
        ) : null,
    }),
  ])
}

/**
 * One job's recent passes.
 *
 * The history is detail, not the headline. The table behind this sheet answers
 * "is the machinery running"; this answers "what has it been doing", which is
 * the second question and only for one job at a time.
 *
 * It takes the job it renders rather than fetching: `jobRunsList` already
 * returns every job with its runs, so a query here would be a second
 * subscription to data the page is holding.
 */
export function JobSheet({
  job,
  label,
  shown,
  now,
  locale,
  onClose,
}: {
  job: Job | null
  /** The job's display name, resolved by the table. */
  label: string
  shown: number
  now: number
  locale: Locale
  onClose: () => void
}) {
  const tableLabels = t(JOBS, locale)
  const dataTableLabels = t(DATA_TABLE, locale)
  const columns = useMemo(() => runColumns(locale, now), [locale, now])

  return (
    <SheetShell
      open={job !== null}
      onOpenChange={(open) => !open && onClose()}
      size="lg"
      title={tableLabels.sheetTitle.replace("{job}", label)}
      description={tableLabels.sheetBody.replace(
        "{n}",
        fmtNumber(shown, locale)
      )}
    >
      <SheetBody>
        <DataTable<Run>
          compact
          columns={columns}
          data={job?.runs ?? []}
          labels={dataTableLabels}
          locale={locale}
          columnLabels={{}}
          getRowId={(row) => row.id}
          empty={
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <TimerIcon className="size-6 text-muted-foreground" />
              <p className="font-medium">{tableLabels.never}</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {tableLabels.neverHint}
              </p>
            </div>
          }
        />
      </SheetBody>
    </SheetShell>
  )
}
