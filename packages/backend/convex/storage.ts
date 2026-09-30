// Deleting uploads that nothing ever took. Why that is safe, and the rule every
// writer of a file reference must follow for it to stay safe, is in
// `model/storage.ts`.
import { v } from "convex/values"

import { internal } from "./_generated/api"
import { internalMutation } from "./_generated/server"
import { recordJobRun } from "./model/jobRuns"
import { sweepUnheldBatch } from "./model/storage"

export const sweep = internalMutation({
  args: { continued: v.optional(v.boolean()) },
  handler: async (ctx, { continued }) => {
    const now = Date.now()
    const { scanned, deleted, more } = await sweepUnheldBatch(ctx, now)
    if (more) {
      await ctx.scheduler.runAfter(0, internal.storage.sweep, {
        continued: true,
      })
    }
    await recordJobRun(ctx, {
      name: "storage.sweep",
      ranAt: now,
      scanned,
      changed: deleted,
      rescheduled: more,
      continued: continued === true,
    })
    return null
  },
})
