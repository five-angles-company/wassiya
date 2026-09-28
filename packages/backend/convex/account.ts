// Deleting an account.
//
// Deletion destroys the vault for good — nobody, Wassiya included, can restore
// it, and the executors receive nothing — so it is never immediate. The owner
// asks from the phone, behind their fingerprint; the vault stays whole for
// `DELETION_GRACE_DAYS`, the owner is mailed at once, and one tap cancels it.
//
// Rules this module holds:
//  - **A death report outranks a pending deletion.** A request is refused
//    while a report is open or once the vault is released, and a request that
//    meets one at its due date is cancelled rather than carried out.
//  - **Staff accounts are refused**: removing the last console Owner by
//    accident must stay impossible.
//  - **The Clerk account is deleted here, with `CLERK_SECRET_KEY`** on the
//    deployment, so Clerk's own self-delete can stay off: a web profile page
//    must not delete a vault without the fingerprint. The Clerk user goes
//    before the `users` row, so a failure never leaves a live sign-in with no
//    row behind it.
//  - The audit log stays. It is append-only, and records that the account
//    existed and was deleted.
import { ConvexError, v } from "convex/values"

import { internal } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import {
  internalAction,
  internalMutation,
  mutation,
  type MutationCtx,
} from "./_generated/server"
import { writeAudit } from "./audit"
import { sendDeletionScheduled } from "./email"
import { isStaffAccount, requireUser } from "./model/access"
import { syncIdentityLookup } from "./model/identityLookup"
import { recordJobRun } from "./model/jobRuns"
import { deleteVaultBatch } from "./model/vault"
import { deleteRequesterThreads } from "./support/admin"

/** Mirrored in the mobile copy that names the grace period; change both. */
export const DELETION_GRACE_DAYS = 7

const DAY_MS = 24 * 60 * 60 * 1000
const SWEEP_BATCH = 10
const ROW_BATCH = 200
const CLERK_ATTEMPTS = 24
const CLERK_RETRY_MS = 60 * 60 * 1000

type Blocker = "staff" | "vault_closed" | "report_open"

export const requestDeletion = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    if (user.deletionDueAt !== undefined) return { dueAt: user.deletionDueAt }
    if (user.deletionStartedAt !== undefined) {
      return { dueAt: user.deletionStartedAt }
    }
    const blocker = await deletionBlocker(ctx, user)
    if (blocker !== null) {
      throw new ConvexError({ code: "deletion", reason: blocker })
    }

    const dueAt = Date.now() + DELETION_GRACE_DAYS * DAY_MS
    await ctx.db.patch("users", user._id, { deletionDueAt: dueAt })
    await writeAudit(ctx, {
      userId: user._id,
      event: "account.deletion_requested",
      meta: { dueAt },
    })
    await ctx.db.insert("notifications", {
      userId: user._id,
      kind: "account.deletion_scheduled",
      payload: { dueAt },
    })
    await sendDeletionScheduled(ctx, user._id, dueAt)
    return { dueAt }
  },
})

export const cancelDeletion = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    if (user.deletionDueAt === undefined) return null
    await ctx.db.patch("users", user._id, { deletionDueAt: undefined })
    await writeAudit(ctx, {
      userId: user._id,
      event: "account.deletion_cancelled",
      meta: {},
    })
    return null
  },
})

/** Start every deletion whose grace period has run out. */
export const sweep = internalMutation({
  args: { continued: v.optional(v.boolean()) },
  handler: async (ctx, { continued }) => {
    const now = Date.now()
    // `gt(0)` keeps rows with no request out of the range: `undefined` sorts
    // before every number in an index.
    const due = await ctx.db
      .query("users")
      .withIndex("by_deletionDueAt", (q) =>
        q.gt("deletionDueAt", 0).lte("deletionDueAt", now)
      )
      .take(SWEEP_BATCH)

    let started = 0
    for (const user of due) {
      const blocker = await deletionBlocker(ctx, user)
      if (blocker !== null) {
        await ctx.db.patch("users", user._id, { deletionDueAt: undefined })
        await writeAudit(ctx, {
          userId: user._id,
          event: "account.deletion_blocked",
          meta: { reason: blocker },
        })
        await ctx.db.insert("notifications", {
          userId: user._id,
          kind: "account.deletion_blocked",
          payload: { reason: blocker },
        })
        continue
      }
      await startDeletion(ctx, user._id, { deleteClerkUser: true })
      started += 1
    }

    const rescheduled = due.length === SWEEP_BATCH
    if (rescheduled) {
      await ctx.scheduler.runAfter(0, internal.account.sweep, {
        continued: true,
      })
    }
    await recordJobRun(ctx, {
      name: "account.sweepDeletions",
      ranAt: now,
      scanned: due.length,
      changed: started,
      rescheduled,
      continued: continued === true,
    })
    return { started }
  },
})

/**
 * Clerk deleted the user — from its dashboard, or as the last step of our own
 * deletion. Our own finishes by itself; anything else is purged the same way,
 * except a released vault, which belongs to its executors until the delivery
 * window closes and `vault.purge` ends it.
 */
export const onClerkDeleted = internalMutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", clerkUserId))
      .unique()
    if (user === null || user.deletionStartedAt !== undefined) return null
    if (user.vaultClosedAt !== undefined) {
      await writeAudit(ctx, {
        userId: user._id,
        event: "account.clerk_deleted_vault_kept",
        meta: {},
      })
      return null
    }
    await startDeletion(ctx, user._id, { deleteClerkUser: false })
    return null
  },
})

/** One batch of the purge; reschedules itself until nothing is left. */
export const purge = internalMutation({
  args: { userId: v.id("users"), deleteClerkUser: v.boolean() },
  handler: async (ctx, { userId, deleteClerkUser }) => {
    if (!(await deletePersonalBatch(ctx, userId))) {
      await ctx.scheduler.runAfter(0, internal.account.purge, {
        userId,
        deleteClerkUser,
      })
      return null
    }
    const user = await ctx.db.get("users", userId)
    if (user === null) return null
    if (deleteClerkUser) {
      await ctx.scheduler.runAfter(0, internal.account.removeClerkUser, {
        userId,
        externalId: user.externalId,
        attempt: 1,
      })
    } else {
      await finish(ctx, userId)
    }
    return null
  },
})

export const removeClerkUser = internalAction({
  args: { userId: v.id("users"), externalId: v.string(), attempt: v.number() },
  handler: async (ctx, { userId, externalId, attempt }) => {
    const secret = process.env.CLERK_SECRET_KEY
    let removed = false
    if (secret === undefined) {
      console.error(
        "CLERK_SECRET_KEY is not set on the deployment — a deleted account's Clerk user was not removed"
      )
    } else {
      const response = await fetch(
        `https://api.clerk.com/v1/users/${encodeURIComponent(externalId)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${secret}` } }
      )
      // 404 is success: already gone, or a retry after a lost response.
      removed = response.ok || response.status === 404
      if (!removed) {
        console.error(`Clerk refused to delete a user (${response.status})`)
      }
    }

    if (removed) {
      await ctx.runMutation(internal.account.finishDeletion, { userId })
    } else if (attempt < CLERK_ATTEMPTS) {
      await ctx.scheduler.runAfter(
        CLERK_RETRY_MS,
        internal.account.removeClerkUser,
        { userId, externalId, attempt: attempt + 1 }
      )
    }
    return null
  },
})

export const finishDeletion = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await finish(ctx, userId)
    return null
  },
})

async function deletionBlocker(
  ctx: MutationCtx,
  user: Doc<"users">
): Promise<Blocker | null> {
  if (isStaffAccount(user)) return "staff"
  if (user.vaultClosedAt !== undefined) return "vault_closed"
  for (const status of ["submitted", "awaiting_veto"] as const) {
    const open = await ctx.db
      .query("claims")
      .withIndex("by_subjectUserId_and_status", (q) =>
        q.eq("subjectUserId", user._id).eq("status", status)
      )
      .first()
    if (open !== null) return "report_open"
  }
  return null
}

/**
 * Past the point of cancelling. The ID-number lookup goes first, so a death
 * report filed from here on cannot find a vault that is being deleted.
 */
async function startDeletion(
  ctx: MutationCtx,
  userId: Id<"users">,
  { deleteClerkUser }: { deleteClerkUser: boolean }
): Promise<void> {
  const now = Date.now()
  await ctx.db.patch("users", userId, {
    deletionDueAt: undefined,
    deletionStartedAt: now,
  })
  await syncIdentityLookup(ctx, userId, [])
  await writeAudit(ctx, {
    userId,
    event: "account.deletion_started",
    meta: {},
  })
  await ctx.scheduler.runAfter(0, internal.account.purge, {
    userId,
    deleteClerkUser,
  })
}

/** Resolves true once nothing of the account is left but its `users` row. */
async function deletePersonalBatch(
  ctx: MutationCtx,
  userId: Id<"users">
): Promise<boolean> {
  if (!(await deleteVaultBatch(ctx, userId))) return false

  const devices = await ctx.db
    .query("devices")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(ROW_BATCH)
  for (const row of devices) await ctx.db.delete("devices", row._id)
  if (devices.length === ROW_BATCH) return false

  const notifications = await ctx.db
    .query("notifications")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(ROW_BATCH)
  for (const row of notifications) await ctx.db.delete("notifications", row._id)
  if (notifications.length === ROW_BATCH) return false

  const checkin = await ctx.db
    .query("checkinConfig")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique()
  if (checkin !== null) await ctx.db.delete("checkinConfig", checkin._id)

  return await deleteRequesterThreads(ctx, userId)
}

async function finish(ctx: MutationCtx, userId: Id<"users">): Promise<void> {
  if ((await ctx.db.get("users", userId)) === null) return
  await syncIdentityLookup(ctx, userId, [])
  await ctx.db.delete("users", userId)
  await writeAudit(ctx, { userId, event: "account.deleted", meta: {} })
}
