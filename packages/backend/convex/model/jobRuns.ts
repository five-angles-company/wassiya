import type { MutationCtx } from "../_generated/server"

/**
 * The runnable jobs, by the name `recordJobRun` writes and the console shows.
 *
 * Mirrors `crons.ts`. A job missing here is one an operator cannot retry; a
 * job here that is not in `crons.ts` is one that never runs on its own.
 *
 * It lives in the model layer rather than in `jobs.ts` because the permission
 * catalogue mints one key per job — `jobs.ts` gates itself with a key derived
 * from this list, so the list cannot live in the file it gates.
 */
export const JOB_NAMES = [
  "checkin.sweep",
  "claims.advance",
  "claims.sweepUnmatched",
  "deliveries.expire",
] as const

export type JobName = (typeof JOB_NAMES)[number]

/**
 * How often each job runs, in hours, mirroring `crons.ts`.
 *
 * The console needs it to judge health: "last ran six hours ago" is a failure
 * for an hourly sweep and unremarkable for a daily one. Without it the console
 * assumed hourly for everything, which would have painted both daily sweeps
 * permanently red the moment they appeared on the screen.
 */
export const JOB_EVERY_HOURS: Record<JobName, number> = {
  "checkin.sweep": 1,
  "claims.advance": 1,
  "claims.sweepUnmatched": 24,
  "deliveries.expire": 24,
}

/**
 * How many runs of one job are kept.
 *
 * Two jobs on an hourly schedule, each able to reschedule itself several times
 * per sweep, is unbounded growth in a table nobody prunes. A few hundred rows
 * is more history than an operator reads and enough to see a gap.
 */
const KEEP_PER_JOB = 200

/**
 * Record one cron invocation.
 *
 * The audit log records *effects* — `checkin.escalated`, `claim.released` — so
 * a sweep that correctly finds nothing due writes nothing at all, and "quiet"
 * is indistinguishable from "dead". In a product whose dead-man's switch
 * failing means no estate is ever delivered, that is the wrong thing to be
 * unable to check. This is the heartbeat that separates them.
 *
 * ## The trim runs once per chain, not once per invocation
 *
 * Both crons process a batch and reschedule themselves when it was full, so one
 * logical run can be twenty invocations. Trimming on each would do twenty
 * bounded deletes for one sweep. `continued` is passed by the reschedule and is
 * absent on the invocation the cron scheduler itself started, which is the one
 * that prunes.
 *
 * The delete is on `jobRuns` and nothing else. `verify-invariants.mjs` guards
 * `auditLog` against `patch`/`replace`/`delete` by name, so this does not trip
 * it — but the guard is table-scoped rather than global, and this is the first
 * delete in the backend, so it is worth saying which table is safe and why.
 */
export async function recordJobRun(
  ctx: MutationCtx,
  run: {
    name: string
    ranAt: number
    scanned: number
    changed: number
    rescheduled: boolean
    /** True on a self-scheduled continuation; the first pass prunes. */
    continued: boolean
  }
): Promise<void> {
  await ctx.db.insert("jobRuns", {
    name: run.name,
    ranAt: run.ranAt,
    scanned: run.scanned,
    changed: run.changed,
    rescheduled: run.rescheduled,
  })

  if (run.continued) return

  // Oldest first, so anything past the keep-window is at the front.
  const rows = await ctx.db
    .query("jobRuns")
    .withIndex("by_name_and_ranAt", (q) => q.eq("name", run.name))
    .take(KEEP_PER_JOB + 50)
  for (const row of rows.slice(0, Math.max(0, rows.length - KEEP_PER_JOB))) {
    await ctx.db.delete("jobRuns", row._id)
  }
}
