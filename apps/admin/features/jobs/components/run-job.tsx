"use client"

import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"
import { useMutation } from "convex/react"
import { PlayIcon } from "lucide-react"
import { toast } from "sonner"

import { ConfirmAction } from "@/components/confirm-action"
import { usePermissions } from "@/hooks/use-permissions"
import { JOBS } from "@/features/jobs/strings/jobs"
import { t, type Locale } from "@/lib/i18n/locale"

/** Mirrors the closed union `jobs.adminRun` accepts. */
export type JobName =
  | "checkin.sweep"
  | "claims.advance"
  | "claims.sweepUnmatched"
  | "deliveries.expire"
  | "support.purgeFiles"

/**
 * Retry a missed sweep.
 *
 * The console could see that a cron had stopped and do nothing about it, which
 * in a product whose dead-man's switch failing means no estate is ever
 * delivered made this screen a diagnosis with no treatment.
 *
 * **Neutral tone, and that is not a shortcut.** Every job behind this button is
 * an idempotent sweep over rows whose deadline has already passed, so running
 * one early cannot bring anything forward — including `deliveries.expire`,
 * which destroys keys but only for deliveries already past their year. The
 * dialog says so, because "run the job that destroys heir keys" deserves an
 * explanation rather than a shrug.
 *
 * It schedules rather than awaits: these jobs batch and self-reschedule, so the
 * honest confirmation is the job's own heartbeat row appearing in the table a
 * moment later, not a return value.
 */
export function RunJob({
  name,
  label,
  locale,
}: {
  name: JobName
  /** The job's display name, so the dialog names what it is about to run. */
  label: string
  locale: Locale
}) {
  const labels = t(JOBS, locale)
  const { has } = usePermissions()
  const run = useMutation(api.jobs.adminRun)

  // Per job, not per screen. `deliveries.expire` destroys locked keys forever
  // and `checkin.sweep` sends email; the backend mints one permission per job
  // name for exactly that reason, so a row an operator may not run shows no
  // button rather than one that throws.
  if (!has(`jobs.run:${name}`)) return null

  return (
    <ConfirmAction
      tone="neutral"
      title={labels.runTitle}
      body={labels.runBody.replace("{job}", label)}
      confirmLabel={labels.run}
      cancelLabel={labels.cancel}
      trigger={
        <Button variant="outline" size="sm">
          <PlayIcon className="size-3.5" aria-hidden />
          {labels.run}
        </Button>
      }
      onConfirm={async () => {
        try {
          await run({ name })
          toast.success(labels.runQueued)
        } catch (error) {
          toast.error(
            labels.runFailed,
            error instanceof Error ? { description: error.message } : undefined
          )
        }
      }}
    />
  )
}
