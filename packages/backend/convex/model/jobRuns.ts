import type { MutationCtx } from "../_generated/server"

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
