// The audit log is append-only.
//
// This file exposes exactly two writes — the `writeAudit` helper for functions
// in the same runtime and the `append` internal mutation for the scheduler and
// HTTP actions — and one owner-scoped read. There is deliberately no `patch`,
// `replace` or `delete` against `auditLog` anywhere in this deployment; that
// absence is the guarantee, and `pnpm run audit:appendonly` greps for it.
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import type { Id } from "./_generated/dataModel"
import { internalMutation, query, type MutationCtx } from "./_generated/server"
import { requireUser } from "./model/access"

/**
 * Scalars only. The schema enforces this too, so there is no shape of `meta`
 * that can carry a `v.bytes()` column — key material cannot reach the log even
 * by accident.
 */
export type AuditMeta = Record<string, string | number | boolean | null>

export type AuditEntry = {
  userId: Id<"users">
  event: string
  deviceId?: Id<"devices">
  meta?: AuditMeta
  at?: number
}

/**
 * Append one entry. Call this directly from mutations — a `ctx.runMutation`
 * hop would split the write out of the caller's transaction, so a failure
 * downstream could leave an audit line describing something that never
 * happened.
 */
export async function writeAudit(
  ctx: MutationCtx,
  entry: AuditEntry
): Promise<void> {
  await ctx.db.insert("auditLog", {
    userId: entry.userId,
    event: entry.event,
    deviceId: entry.deviceId,
    meta: entry.meta ?? {},
    at: entry.at ?? Date.now(),
  })
}

/** The same write, reachable from actions, HTTP handlers and the scheduler. */
export const append = internalMutation({
  args: {
    userId: v.id("users"),
    event: v.string(),
    deviceId: v.optional(v.id("devices")),
    meta: v.optional(
      v.record(
        v.string(),
        v.union(v.string(), v.number(), v.boolean(), v.null())
      )
    ),
    at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await writeAudit(ctx, args)
    return null
  },
})

/** Owner-only, newest first. The owner sees their own log and nobody else's. */
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const user = await requireUser(ctx)
    return await ctx.db
      .query("auditLog")
      .withIndex("by_userId_and_at", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(paginationOpts)
  },
})
