"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import type { FunctionReturnType } from "convex/server"
import { useQuery } from "convex/react"
import { TimerIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { JOBS } from "@/features/jobs/strings/jobs"
import { fmtDate, fmtNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

type Job = FunctionReturnType<typeof api.admin.jobRunsList>["jobs"][number]

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS

/** The cron names as `crons.ts` registers them, in the operator's language. */
function jobLabel(name: string, locale: Locale): string {
  const labels = t(JOBS, locale)
  if (name === "checkin.sweep") return labels.jobCheckinSweep
  if (name === "claims.advance") return labels.jobClaimsAdvance
  return name
}

/**
 * How stale the last run is, and whether that is alarming.
 *
 * Both crons are hourly, so anything past two hours means one has been missed.
 * Rendered as a tone rather than a number alone, because "3 hours ago" only
 * means something if you already know the schedule.
 */
function staleness(ranAt: number, now: number): "fresh" | "late" | "stale" {
  const age = now - ranAt
  if (age < 2 * HOUR_MS) return "fresh"
  if (age < 6 * HOUR_MS) return "late"
  return "stale"
}

function JobCard({
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

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex-row items-center justify-between gap-3 border-b py-3">
        <CardTitle className="font-heading text-sm">
          {jobLabel(job.name, locale)}
        </CardTitle>
        {job.lastRun !== null && (
          <Badge
            variant={
              staleness(job.lastRun.ranAt, now) === "fresh"
                ? "secondary"
                : "destructive"
            }
          >
            {fmtDate(job.lastRun.ranAt, locale)}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex flex-col px-0 py-0">
        {job.lastRun === null ? (
          // Not the same as "stopped", and saying so is the entire reason this
          // table exists — a job renamed or added after recording began has no
          // rows and is perfectly healthy.
          <div className="flex flex-col gap-1 px-4 py-4">
            <p className="text-sm font-medium">{labels.never}</p>
            <p className="text-sm text-muted-foreground">{labels.neverHint}</p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-4 border-b px-4 py-2.5">
              <span className="text-xs text-muted-foreground">
                {labels.lastRun}
              </span>
              <span className="text-sm tabular-nums">
                {labels.scanned.replace(
                  "{n}",
                  fmtNumber(job.lastRun.scanned, locale)
                )}
                {" · "}
                {labels.changed.replace(
                  "{n}",
                  fmtNumber(job.lastRun.changed, locale)
                )}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-4 border-b px-4 py-2.5">
              <span className="text-xs text-muted-foreground">
                {labels.lastChange}
              </span>
              <span className="text-end text-sm tabular-nums">
                {job.lastChange !== null ? (
                  fmtDate(job.lastChange.ranAt, locale)
                ) : job.changeOutsideWindow ? (
                  <span className="text-muted-foreground">
                    {labels.noChangeHint.replace(
                      "{n}",
                      fmtNumber(shown, locale)
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {labels.noChangeYet}
                  </span>
                )}
              </span>
            </div>

            <div className="px-4 py-2.5">
              <p className="mb-2 text-xs text-muted-foreground">
                {labels.runsTitle}
              </p>
              <div className="flex flex-col gap-1">
                {job.runs.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-baseline justify-between gap-3 text-xs"
                  >
                    <span className="tabular-nums text-muted-foreground">
                      {fmtDate(run.ranAt, locale)}
                    </span>
                    <span className="tabular-nums">
                      {fmtNumber(run.scanned, locale)} /{" "}
                      <span
                        className={
                          run.changed > 0 ? "font-medium" : "text-muted-foreground"
                        }
                      >
                        {fmtNumber(run.changed, locale)}
                      </span>
                      {run.rescheduled && " ↻"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Whether the machinery is running.
 *
 * The audit log records *effects* — `checkin.escalated`, `claim.released` — so
 * an hourly sweep that correctly finds nothing due wrote nothing at all, and
 * "quiet" was indistinguishable from "dead". In a product whose dead-man's
 * switch failing means no estate is ever delivered, that is the wrong thing to
 * be unable to check.
 *
 * `jobRuns` separates them, and this screen shows both halves per job: the most
 * recent run says the cron is alive, the most recent *change* says when it last
 * had work. Neither alone answers the question.
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
    <div className="flex flex-col gap-4">
      <p className="max-w-3xl text-sm text-muted-foreground">{labels.intro}</p>

      {data.jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <TimerIcon className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{labels.never}</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.jobs.map((job) => (
            <JobCard
              key={job.name}
              job={job}
              shown={data.shown}
              now={now}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  )
}
