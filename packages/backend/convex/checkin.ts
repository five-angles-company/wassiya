// The dead man's switch.
//
// ⚠️ Product rule, load-bearing: confirming life is ALWAYS biometric-gated on
// the device and exists in exactly ONE place — the check-in prompt. Rows,
// notifications and widgets may report and navigate, never confirm. `confirm`
// below is that single endpoint, and no second one may ever be added: an
// unlocked phone in the wrong hands could otherwise suppress delivery forever.
import { v } from "convex/values"

import type { Doc } from "./_generated/dataModel"
import { internal } from "./_generated/api"
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server"
import { writeAudit } from "./audit"
import { sendEscalation } from "./email"
import { recordJobRun } from "./model/jobRuns"
import { requireUser } from "./model/access"
import { DAY_MS } from "./model/claimFlow"

const MONTH_MS = 30 * DAY_MS
const SNOOZE_MS = 7 * DAY_MS

/** Days past `nextDueAt` at which each escalation step fires. */
const ESCALATION_STEPS = [
  { afterDays: 0, state: "day0" as const },
  { afterDays: 7, state: "day7" as const },
  { afterDays: 14, state: "day14" as const },
  { afterDays: 30, state: "countdown" as const },
]

/** How many overdue configs one cron pass advances before rescheduling itself. */
const SWEEP_BATCH = 50

/**
 * The states a row can still escalate *out of*. "countdown" is the terminal
 * step, so draining it would be pure scanning with nothing to advance.
 */
const SOURCE_STATES = ["idle", "day0", "day7", "day14"] as const

// Returns `nextDueAt` and lets the caller decide whether that is overdue.
//
// A query is not rerun because time passed, so an `overdue` boolean computed
// from `Date.now()` here would be stale the moment the deadline crossed and
// would stay stale until an unrelated write invalidated the query — on exactly
// the screen where being wrong matters most. `escalationState` is the
// server-materialised view of the same thing, advanced by the `sweep` cron.
export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const config = await ctx.db
      .query("checkinConfig")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique()
    if (config === null) {
      return null
    }
    return {
      cadenceMonths: config.cadenceMonths,
      graceDays: config.graceDays,
      lastConfirmedAt: config.lastConfirmedAt,
      nextDueAt: config.nextDueAt,
      escalationState: config.escalationState,
    }
  },
})

export const configure = mutation({
  args: { cadenceMonths: v.number(), graceDays: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    if (args.cadenceMonths < 1 || args.cadenceMonths > 24) {
      throw new Error("cadenceMonths must be between 1 and 24")
    }
    if (args.graceDays < 0 || args.graceDays > 90) {
      throw new Error("graceDays must be between 0 and 90")
    }

    const now = Date.now()
    const existing = await ctx.db
      .query("checkinConfig")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique()
    const lastConfirmedAt = existing?.lastConfirmedAt ?? now
    const fields = {
      userId: user._id,
      cadenceMonths: args.cadenceMonths,
      graceDays: args.graceDays,
      lastConfirmedAt,
      escalationState: "idle" as const,
      nextDueAt: dueAfter(lastConfirmedAt, args.cadenceMonths, args.graceDays),
    }

    if (existing === null) {
      await ctx.db.insert("checkinConfig", fields)
    } else {
      await ctx.db.replace("checkinConfig", existing._id, fields)
    }
    await writeAudit(ctx, {
      userId: user._id,
      event: "checkin.configured",
      meta: { cadenceMonths: args.cadenceMonths, graceDays: args.graceDays },
    })
    return null
  },
})

/**
 * The ONLY confirmation endpoint. The client must gate the call behind a
 * biometric prompt; nothing else in this deployment resets the clock.
 */
export const confirm = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const config = await requireConfig(ctx, user)
    const now = Date.now()

    await ctx.db.patch("checkinConfig", config._id, {
      lastConfirmedAt: now,
      escalationState: "idle",
      nextDueAt: dueAfter(now, config.cadenceMonths, config.graceDays),
    })
    await writeAudit(ctx, {
      userId: user._id,
      event: "checkin.confirmed",
      meta: { fromState: config.escalationState },
    })
    return null
  },
})

/**
 * Buy seven more days without confirming life. Deliberately weaker than
 * `confirm`: it pushes the deadline but leaves the escalation state alone, so
 * a snooze cannot quietly reset an escalation already under way.
 */
export const snooze7d = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const config = await requireConfig(ctx, user)
    await ctx.db.patch("checkinConfig", config._id, {
      nextDueAt: Math.max(config.nextDueAt, Date.now()) + SNOOZE_MS,
    })
    await writeAudit(ctx, {
      userId: user._id,
      event: "checkin.snoozed",
      meta: { days: 7 },
    })
    return null
  },
})

/**
 * Cron body: advance every overdue config to the escalation state its elapsed
 * time calls for, and write the notification that step deserves.
 *
 * It drains per source state rather than paginating a flat overdue window, and
 * that is the whole design. Two properties make it terminate without a cursor,
 * and without ever skipping a row:
 *
 *  1. **Advancing removes a row from the bucket being drained.** The index is
 *     keyed on `escalationState` first, so the moment a row's state changes it
 *     leaves this query's range. A flat `by_nextDueAt` index cannot do that —
 *     rows already at the right state sit at the front of the window forever
 *     and starve everything behind them, and a `gt(nextDueAt)` cursor makes it
 *     worse by permanently skipping rows that share a boundary timestamp.
 *  2. **Within a bucket, the rows that need advancing sort first.** Rows come
 *     back by ascending `nextDueAt`, so the most overdue come first — and being
 *     more overdue is exactly what makes a row due for a higher state. Rows
 *     needing no change are therefore always behind the ones that do, never in
 *     front of them soaking up the batch.
 *
 * The self-schedule fires only when a full batch was actually *advanced*, so
 * each continuation makes strict progress against a finite backlog.
 */
export const sweep = internalMutation({
  // Set by the reschedule below, absent on the pass the cron itself started.
  // `recordJobRun` prunes only on the first, so one logical sweep leaves one
  // trim behind rather than one per batch.
  args: { continued: v.optional(v.boolean()) },
  handler: async (ctx, { continued }) => {
    const now = Date.now()
    let scanned = 0
    let advanced = 0

    for (const state of SOURCE_STATES) {
      if (advanced >= SWEEP_BATCH) {
        break
      }
      const due = await ctx.db
        .query("checkinConfig")
        .withIndex("by_escalationState_and_nextDueAt", (q) =>
          q.eq("escalationState", state).lte("nextDueAt", now)
        )
        .take(SWEEP_BATCH - advanced)
      scanned += due.length

      for (const config of due) {
        const next = escalationFor(now - config.nextDueAt)
        if (next === config.escalationState) {
          continue
        }
        await ctx.db.patch("checkinConfig", config._id, {
          escalationState: next,
        })
        await ctx.db.insert("notifications", {
          userId: config.userId,
          kind: `checkin.${next}`,
          payload: {
            nextDueAt: config.nextDueAt,
            daysOverdue: Math.floor((now - config.nextDueAt) / DAY_MS),
          },
        })

        // The in-app notification above is for an owner who opens the app; the
        // email is for the one who has stopped, which is the case this whole
        // ladder exists for. Enqueued inside the same transaction that advanced
        // the row, so "escalated" and "the owner was told" cannot disagree.
        // Every state but `idle`, which means *not* escalated — a row can only
        // reach it by going backwards, and there is nothing to tell an owner
        // about a ladder they are no longer on.
        if (next !== "idle") {
          await sendEscalation(ctx, config.userId, next)
        }
        await writeAudit(ctx, {
          userId: config.userId,
          event: "checkin.escalated",
          meta: { from: config.escalationState, to: next },
          at: now,
        })
        advanced += 1
      }
    }

    const rescheduled = advanced === SWEEP_BATCH
    if (rescheduled) {
      await ctx.scheduler.runAfter(0, internal.checkin.sweep, {
        continued: true,
      })
    }

    // The heartbeat. Written on every pass including the ones that advance
    // nothing — which is the whole point: an escalation ladder that finds
    // nobody due is doing its job, and until this row existed that was
    // indistinguishable from a cron that had stopped running.
    await recordJobRun(ctx, {
      name: "checkin.sweep",
      ranAt: now,
      scanned,
      changed: advanced,
      rescheduled,
      continued: continued === true,
    })

    return { scanned, advanced }
  },
})

function dueAfter(
  from: number,
  cadenceMonths: number,
  graceDays: number
): number {
  return from + cadenceMonths * MONTH_MS + graceDays * DAY_MS
}

/** How far past due maps to which state. Latest matching step wins. */
function escalationFor(
  overdueMs: number
): Doc<"checkinConfig">["escalationState"] {
  const overdueDays = overdueMs / DAY_MS
  let state: Doc<"checkinConfig">["escalationState"] = "idle"
  for (const step of ESCALATION_STEPS) {
    if (overdueDays >= step.afterDays) {
      state = step.state
    }
  }
  return state
}

async function requireConfig(
  ctx: MutationCtx,
  user: Doc<"users">
): Promise<Doc<"checkinConfig">> {
  const config = await ctx.db
    .query("checkinConfig")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .unique()
  if (config === null) {
    throw new Error("Check-in is not configured")
  }
  return config
}
