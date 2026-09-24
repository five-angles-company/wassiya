// Support attachments are screenshots and documents people send while stuck,
// often of identity papers. They are deleted a fixed time after the thread is
// resolved; the text of the conversation stays.
import { v } from "convex/values"

import { internal } from "../_generated/api"
import { internalMutation } from "../_generated/server"
import { recordJobRun } from "../model/jobRuns"
import { FILE_RETENTION_MS } from "../model/support"

const THREAD_BATCH = 20
const MESSAGES_PER_THREAD = 500

export const purgeFiles = internalMutation({
  args: { continued: v.optional(v.boolean()) },
  handler: async (ctx, { continued }) => {
    const now = Date.now()
    const due = await ctx.db
      .query("supportThreads")
      .withIndex("by_filesPurgedAt_and_status_and_resolvedAt", (q) =>
        q
          .eq("filesPurgedAt", undefined)
          .eq("status", "resolved")
          .lt("resolvedAt", now - FILE_RETENTION_MS)
      )
      .take(THREAD_BATCH)

    let files = 0
    for (const thread of due) {
      const messages = await ctx.db
        .query("supportMessages")
        .withIndex("by_threadId_and_at", (q) => q.eq("threadId", thread._id))
        .take(MESSAGES_PER_THREAD)
      for (const message of messages) {
        if (message.attachments.length === 0) continue
        for (const file of message.attachments) {
          await ctx.storage.delete(file.storageId)
          files += 1
        }
        await ctx.db.patch("supportMessages", message._id, { attachments: [] })
      }
      await ctx.db.patch("supportThreads", thread._id, { filesPurgedAt: now })
    }

    const rescheduled = due.length === THREAD_BATCH
    if (rescheduled) {
      await ctx.scheduler.runAfter(0, internal.support.retention.purgeFiles, {
        continued: true,
      })
    }
    await recordJobRun(ctx, {
      name: "support.purgeFiles",
      ranAt: now,
      scanned: due.length,
      changed: files,
      rescheduled,
      continued: continued === true,
    })
    return { threads: due.length, files }
  },
})
