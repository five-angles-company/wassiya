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
import { JobSheet } from "@/features/jobs/components/job-sheet"
import { RunJob, type JobName } from "@/features/jobs/components/run-job"
import { JOBS } from "@/features/jobs/strings/jobs"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtAgo, fmtNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"

type Job = FunctionReturnType<typeof api.admin.jobRunsList>["jobs"][number]

const HOUR_MS = 60 * 60 * 1000

const helper = createColumnHelper<DataTableFeatures, Job>()

/** The cron names as `crons.ts` registers them, in the operator's language. */
export function jobLabel(name: string, locale: Locale): string {
  const labels = t(JOBS, locale)
  if (name === "checkin.sweep") return labels.jobCheckinSweep
  if (name === "claims.advance") return labels.jobClaimsAdvance
  if (name === "claims.sweepUnmatched") return labels.jobClaimsUnmatched
  if (name === "deliveries.expire") return labels.jobDeliveriesExpire
  if (name === "support.purgeFiles") return labels.jobSupportPurge
  // A name with no label is a cron that was added without one. Showing it raw
  // beats hiding the job.
  return name
}

/**
 * The four states a job can be in, and the two schedules it can run on.
 *
 * Both are facet vocabularies as well as cell labels, so they are lists rather
 * than a chain of conditions — a facet offering a value no row can hold, or
 * missing one that rows do, is a filter that lies about the table.
 */
export const JOB_STATES = ["fresh", "late", "stale", "never"] as const
export type JobState = (typeof JOB_STATES)[number]

export const JOB_SCHEDULES = ["hourly", "daily"] as const

export function stateLabel(state: JobState, locale: Locale): string {
  const labels = t(JOBS, locale)
  if (state === "fresh") return labels.healthFresh
  if (state === "late") return labels.healthLate
  if (state === "stale") return labels.healthStale
  return labels.never
}

export function scheduleLabel(value: string, locale: Locale): string {
  const labels = t(JOBS, locale)
  return value === "daily" ? labels.daily : labels.hourly
}

/** `never` is a state, not a missing value: a job can be registered and silent. */
function stateOf(job: Job, now: number): JobState {
  return job.lastRun === null
    ? "never"
    : health(job.lastRun.ranAt, now, job.everyHours)
}

/**
 * Whether the last run is recent enough *for this job's own schedule*.
 *
 * Two missed passes is late, six is likely stopped — measured in multiples of
 * the job's interval rather than in fixed hours, because the crons are not all
 * hourly. Reading a daily sweep against an hourly yardstick would paint it red
 * every morning, which is how a health badge stops being read at all.
 *
 * Reported as a verdict rather than a raw age: "3 hours ago" only means
 * something to a reader who already knows the schedule, which is exactly the
 * knowledge this screen exists to not require.
 */
function health(
  ranAt: number,
  now: number,
  everyHours: number
): "fresh" | "late" | "stale" {
  const interval = Math.max(1, everyHours) * HOUR_MS
  const age = now - ranAt
  if (age < 2 * interval) return "fresh"
  if (age < 6 * interval) return "late"
  return "stale"
}

function jobColumns(
  locale: Locale,
  now: number,
  shown: number
): ColumnDef<DataTableFeatures, Job>[] {
  const labels = t(JOBS, locale)

  return helper.columns([
    helper.accessor((row) => jobLabel(row.name, locale), {
      id: "job",
      enableSorting: false,
      header: () => labels.colJob,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {jobLabel(row.original.name, locale)}
          </span>
          <span
            dir="ltr"
            className="inline-block text-xs text-muted-foreground"
          >
            {row.original.name}
          </span>
        </div>
      ),
    }),

    // Accessors, not display columns: a facet filters on a column's value, so
    // the value has to be the thing being filtered rather than a rendered
    // badge. The cell draws the badge from it.
    helper.accessor((row) => (row.everyHours >= 24 ? "daily" : "hourly"), {
      id: "schedule",
      enableSorting: false,
      filterFn: "arrIncludesSome",
      header: () => labels.colSchedule,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {scheduleLabel(
            row.original.everyHours >= 24 ? "daily" : "hourly",
            locale
          )}
        </span>
      ),
    }),

    helper.accessor((row) => stateOf(row, now), {
      id: "health",
      enableSorting: false,
      filterFn: "arrIncludesSome",
      header: () => labels.colHealth,
      cell: ({ row }) => {
        const state = stateOf(row.original, now)
        return (
          <Badge
            variant={
              state === "fresh"
                ? "secondary"
                : state === "never"
                  ? "outline"
                  : "destructive"
            }
          >
            {stateLabel(state, locale)}
          </Badge>
        )
      },
    }),

    helper.display({
      id: "lastRun",
      header: () => labels.colLastRun,
      cell: ({ row }) => {
        const lastRun = row.original.lastRun
        return lastRun === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className="whitespace-nowrap tabular-nums">
            {fmtAgo(lastRun.ranAt, now, locale)}
          </span>
        )
      },
    }),

    // A sweep that finds nothing is healthy, so this is muted rather than
    // alarming — and when there is no change in the window at all, it says
    // which of the two reasons applies instead of leaving a blank.
    helper.display({
      id: "lastChange",
      header: () => labels.colLastChange,
      cell: ({ row }) => {
        const lastChange = row.original.lastChange
        if (lastChange !== null) {
          return (
            <span className="whitespace-nowrap text-muted-foreground tabular-nums">
              {fmtAgo(lastChange.ranAt, now, locale)}
            </span>
          )
        }
        return (
          <span className="text-xs text-muted-foreground">
            {row.original.changeOutsideWindow
              ? labels.noChangeHint.replace("{n}", fmtNumber(shown, locale))
              : labels.noChangeYet}
          </span>
        )
      },
    }),

    helper.display({
      id: "actions",
      enableHiding: false,
      header: () => <span className="sr-only">{labels.colActions}</span>,
      cell: ({ row }) => (
        <div
          className="flex items-center justify-end"
          // The row opens the history; the button runs the job. Without this
          // the button would do both.
          onClick={(event) => event.stopPropagation()}
        >
          <RunJob
            name={row.original.name as JobName}
            label={jobLabel(row.original.name, locale)}
            locale={locale}
          />
        </div>
      ),
    }),
  ])
}

/**
 * Whether the machinery is running.
 *
 * The audit log records *effects* — `checkin.escalated`, `claim.released` — so
 * a sweep that correctly finds nothing due wrote nothing at all, and "quiet"
 * was indistinguishable from "dead". In a product whose dead-man's switch
 * failing means no estate is ever delivered, that is the wrong thing to be
 * unable to check. `jobRuns` separates them.
 *
 * **One row per cron, its history behind a click.** This screen was four
 * stacked panels, which made it the last page in the console that was not a
 * table: no search, no column visibility, no export, and a reader comparing two
 * jobs had to scroll between two cards to do it. Four rows side by side answer
 * "is anything stopped" in one glance, which is the question the page exists
 * for.
 */
export function JobsTable() {
  const locale = useLocale()
  const labels = useMemo(() => t(JOBS, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])

  // Once per mount: a health verdict that disagreed with itself between
  // renders would be worse than a slightly stale one.
  const [now] = useState(() => Date.now())
  const data = useQuery(api.admin.jobRunsList, {})
  const [open, setOpen] = useState<string | null>(null)

  const columns = useMemo(
    () => jobColumns(locale, now, data?.shown ?? 0),
    [locale, now, data?.shown]
  )
  const columnLabels = useMemo(
    () => ({
      job: labels.colJob,
      schedule: labels.colSchedule,
      health: labels.colHealth,
      lastRun: labels.colLastRun,
      lastChange: labels.colLastChange,
    }),
    [labels]
  )

  if (data === undefined) {
    return <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
  }

  const selected = data.jobs.find((job) => job.name === open) ?? null

  return (
    <>
      <DataTable<Job>
        columns={columns}
        data={data.jobs}
        fill
        searchPlaceholder={labels.searchPlaceholder}
        labels={tableLabels}
        locale={locale}
        columnLabels={columnLabels}
        getRowId={(row) => row.name}
        onRowClick={(row) => setOpen(row.name)}
        facets={[
          {
            columnId: "health",
            title: labels.colHealth,
            options: JOB_STATES.map((value) => ({
              value,
              label: stateLabel(value, locale),
            })),
          },
          {
            columnId: "schedule",
            title: labels.colSchedule,
            options: JOB_SCHEDULES.map((value) => ({
              value,
              label: scheduleLabel(value, locale),
            })),
          },
        ]}
        empty={
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <TimerIcon className="size-6 text-muted-foreground" />
            <span className="font-medium">{labels.empty}</span>
            <span className="max-w-sm text-sm text-muted-foreground">
              {labels.emptyHint}
            </span>
          </div>
        }
      />
      <JobSheet
        job={selected}
        label={selected === null ? "" : jobLabel(selected.name, locale)}
        shown={data.shown}
        now={now}
        locale={locale}
        onClose={() => setOpen(null)}
      />
    </>
  )
}
