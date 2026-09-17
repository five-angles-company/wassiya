"use client"

import { useMemo, useState } from "react"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import type { FunctionReturnType } from "convex/server"
import { useQuery } from "convex/react"
import { TimerIcon } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { useLocale } from "@/components/locale-provider"
import { TableCard } from "@/components/table-card"
import { JOBS } from "@/features/jobs/strings/jobs"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtAgo, fmtDate, fmtNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"

type Job = FunctionReturnType<typeof api.admin.jobRunsList>["jobs"][number]
type Run = Job["runs"][number]

const HOUR_MS = 60 * 60 * 1000

const helper = createColumnHelper<DataTableFeatures, Run>()

/** The cron names as `crons.ts` registers them, in the operator's language. */
function jobLabel(name: string, locale: Locale): string {
  const labels = t(JOBS, locale)
  if (name === "checkin.sweep") return labels.jobCheckinSweep
  if (name === "claims.advance") return labels.jobClaimsAdvance
  return name
}

/**
 * Whether the last run is recent enough for an hourly job.
 *
 * Both crons run every hour, so anything past two means one was missed and
 * past six means several were. Reported as a verdict rather than a raw age:
 * "3 hours ago" only means something to a reader who already knows the
 * schedule, which is exactly the knowledge this screen exists to not require.
 */
function health(ranAt: number, now: number): "fresh" | "late" | "stale" {
  const age = now - ranAt
  if (age < 2 * HOUR_MS) return "fresh"
  if (age < 6 * HOUR_MS) return "late"
  return "stale"
}

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
          <span className="text-xs tabular-nums text-muted-foreground">
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
        <span className="tabular-nums text-muted-foreground">
          {fmtNumber(row.original.scanned, locale)}
        </span>
      ),
    }),
    // Emphasised only when non-zero. A column of zeroes is the healthy case
    // for an hourly sweep, and it should read as calm rather than as failure.
    helper.accessor("changed", {
      id: "changed",
      enableSorting: false,
      header: () => labels.colChanged,
      cell: ({ row }) => (
        <span
          className={
            row.original.changed > 0
              ? "font-medium tabular-nums"
              : "tabular-nums text-muted-foreground"
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

function JobPanel({
  job,
  shown,
  now,
  locale,
}: {
  job: Job
  shown: number
  now: number
  locale: Locale
}) {
  const labels = t(JOBS, locale)
  const tableLabels = t(DATA_TABLE, locale)
  const columns = useMemo(() => runColumns(locale, now), [locale, now])

  const state = job.lastRun === null ? null : health(job.lastRun.ranAt, now)

  return (
    <TableCard
      title={jobLabel(job.name, locale)}
      hint={
        job.lastRun === null
          ? labels.neverHint
          : labels.ranAgo.replace(
              "{ago}",
              fmtAgo(job.lastRun.ranAt, now, locale)
            )
      }
      action={
        state === null ? (
          <Badge variant="outline">{labels.never}</Badge>
        ) : (
          <Badge variant={state === "fresh" ? "secondary" : "destructive"}>
            {state === "fresh"
              ? labels.healthFresh
              : state === "late"
                ? labels.healthLate
                : labels.healthStale}
          </Badge>
        )
      }
      footnote={
        job.lastChange !== null
          ? `${labels.lastChange}: ${fmtAgo(job.lastChange.ranAt, now, locale)}`
          : job.changeOutsideWindow
            ? labels.noChangeHint.replace("{n}", fmtNumber(shown, locale))
            : labels.noChangeYet
      }
    >
      <DataTable<Run>
        compact
        columns={columns}
        data={job.runs}
        labels={tableLabels}
        locale={locale}
        columnLabels={{}}
        getRowId={(row) => row.id}
        empty={
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <TimerIcon className="size-6 text-muted-foreground" />
            <p className="font-medium">{labels.never}</p>
          </div>
        }
      />
    </TableCard>
  )
}

/**
 * Whether the machinery is running.
 *
 * The audit log records *effects* — `checkin.escalated`, `claim.released` — so
 * an hourly sweep that correctly finds nothing due wrote nothing at all, and
 * "quiet" was indistinguishable from "dead". In a product whose dead-man's
 * switch failing means no estate is ever delivered, that is the wrong thing to
 * be unable to check. `jobRuns` separates them.
 *
 * Each job is a `TableCard` with a column-headed table, the same panel the
 * dashboard uses, with the health verdict as the action badge, the age as the
 * hint and the last change as the footnote. The verdict is a word rather than a
 * timestamp on purpose: "Ran at 20:38" requires the reader to know the schedule
 * before it means anything; "Running" against an hourly job does not.
 */
export function JobsBoard() {
  const locale = useLocale()
  const labels = t(JOBS, locale)
  const [now] = useState(() => Date.now())
  const data = useQuery(api.admin.jobRunsList, {})

  if (data === undefined) {
    return <Skeleton className="h-96 w-full rounded-xl" />
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-muted-foreground">{labels.intro}</p>

      {data.jobs.map((job) => (
        <JobPanel
          key={job.name}
          job={job}
          shown={data.shown}
          now={now}
          locale={locale}
        />
      ))}
    </div>
  )
}
