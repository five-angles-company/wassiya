// Running a scheduled sweep by hand.
//
// The console could see the crons and do nothing about them. In a product whose
// dead-man's switch failing means no estate is ever delivered, "the sweep has
// not run since Tuesday" needs an answer that is not "wait an hour and hope".
//
// ## Why this is safe, and what makes it safe
//
// Every job here is an **idempotent, date-filtered sweep**: it acts on rows
// whose deadline has already passed and nothing else. Running one early
// therefore cannot bring anything forward — `deliveries.expire` destroys only
// deliveries already past their year, `claims.advance` releases only claims
// whose veto window has already elapsed. That property is what makes a button
// acceptable at all, and a job that did not have it must not be added to this
// registry.
//
// The registry is a closed union rather than a string, so the console cannot
// schedule an arbitrary internal function by name.
import type { FunctionReference } from "convex/server"
import { v } from "convex/values"

import { internal } from "./_generated/api"
import { mutation } from "./_generated/server"
import { writeStaffAudit } from "./audit"
import { requirePermission } from "./model/access"
import { type JobName } from "./model/jobRuns"
import { JOB_RUN_PERMISSION } from "./model/permissions"

// Annotated, not inferred: `internal` contains this module, so letting
// TypeScript infer the map's type makes it reference its own initialiser.
const RUNNABLE: Record<JobName, FunctionReference<"mutation", "internal">> = {
  "checkin.sweep": internal.checkin.sweep,
  "claims.advance": internal.claims.advance,
  "claims.sweepUnmatched": internal.claims.sweepUnmatched,
  "deliveries.expire": internal.deliveries.expire,
}

const jobName = v.union(
  v.literal("checkin.sweep"),
  v.literal("claims.advance"),
  v.literal("claims.sweepUnmatched"),
  v.literal("deliveries.expire")
)

/**
 * Run a sweep now.
 *
 * Scheduled rather than awaited: these jobs batch and self-reschedule, so a
 * synchronous call would either block the console on a long chain or return
 * before the work it triggered had finished — and the honest answer to "did it
 * work" is the job's own heartbeat row, which the table is already showing.
 *
 * Audited under the operator rather than a subject, because the subject is the
 * deployment: this is an operator acting on the machinery, not on an account.
 *
 * ⚠️ **Gated per job, not per screen.** The permission is minted from the job's
 * own name, because these are not equally grave: `deliveries.expire` destroys
 * locked keys and bundles irreversibly, and someone who should be able to
 * nudge `claims.advance` must not inherit that because both are buttons on the
 * same table. The check also has to happen *here* — the scheduler runs the
 * internal mutation with no identity, so there is no second chance later.
 */
export const adminRun = mutation({
  args: { name: jobName },
  handler: async (ctx, { name }) => {
    const actor = await requirePermission(ctx, JOB_RUN_PERMISSION[name])

    await ctx.scheduler.runAfter(0, RUNNABLE[name], {})
    await writeStaffAudit(ctx, {
      actor,
      subject: actor._id,
      event: "job.run_requested",
      meta: { job: name },
    })
    return null
  },
})
