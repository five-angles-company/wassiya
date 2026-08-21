// Death claims — the path that ends in releasing an inheritance.
//
// The transition table lives in `model/claimFlow.ts` and was written before
// this file. Nothing here moves a claim except through those guards, and
// `release.releasedBundleForHeir` re-checks `status === "released"` on its own
// rather than trusting anything decided in this file.
//
// Four independent facts must all hold before a release: the claimant is
// Didit-verified, the death certificate's name matches the owner's verified
// legal name (an admin's judgement, never a string comparison), the guardian
// has confirmed, and the veto window has elapsed with no veto.
import { v } from "convex/values"

import { internal } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server"
import { writeAudit } from "./audit"
import {
  requireAcceptedGuardian,
  requireAdmin,
  requireUser,
} from "./model/access"
import {
  CLAIM_RATE_LIMIT,
  CLAIM_RATE_WINDOW_MS,
  DAY_MS,
  VETO_LOCKOUT_DAYS,
  VETO_WINDOW_DAYS,
  isLockedOut,
  nameMatchOutcome,
  vetoWindowElapsed,
} from "./model/claimFlow"
import { getCurrentUserOrThrow } from "./users"

const ADVANCE_BATCH = 50

/**
 * File a claim against a vault.
 *
 * The claimant must be signed in: identity verification is mandatory for heirs
 * at claim time anyway, and an account is what makes the rate limit and the
 * 90-day lockout attach to a person rather than to a typed-in string.
 *
 * The return value is identical whether or not `subjectEmail` names a real
 * vault. That is on purpose — an honest "no such vault" would turn this into an
 * email-enumeration oracle for anyone curious who uses Wassiya.
 */
export const submit = mutation({
  args: {
    subjectEmail: v.string(),
    claimantName: v.string(),
    claimantContact: v.string(),
    certificateStorageId: v.optional(v.id("_storage")),
    certificateName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const claimant = await getCurrentUserOrThrow(ctx)
    const now = Date.now()

    await assertUnderRateLimit(ctx, claimant._id, now)

    const subject = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.subjectEmail))
      .unique()
    if (subject === null || subject._id === claimant._id) {
      return { received: true }
    }

    const prior = await ctx.db
      .query("claims")
      .withIndex("by_subjectUserId_and_claimantContact", (q) =>
        q
          .eq("subjectUserId", subject._id)
          .eq("claimantContact", args.claimantContact)
      )
      .take(20)

    // An open claim already exists — do not stack a second one on it.
    const open = prior.find(
      (claim) =>
        claim.status === "submitted" ||
        claim.status === "guardian_review" ||
        claim.status === "awaiting_veto"
    )
    if (open !== undefined) {
      return { received: true }
    }

    // A veto within the last 90 days bars this claimant. The attempt is still
    // recorded — as a `locked` claim — because a barred attempt is exactly the
    // kind of thing the owner and the audit log should see.
    const lockout = prior.find((claim) => isLockedOut(claim, now))
    const barred = lockout !== undefined

    const claimId = await ctx.db.insert("claims", {
      subjectUserId: subject._id,
      claimantName: args.claimantName,
      claimantContact: args.claimantContact,
      claimantUserId: claimant._id,
      claimantIdentityStatus: claimant.identityStatus ?? "unverified",
      certificateStorageId: args.certificateStorageId,
      certificateName: args.certificateName,
      status: barred ? "locked" : "submitted",
      lockedUntil: barred ? lockout.lockedUntil : undefined,
    })

    const event = barred ? "claim.blocked_by_lockout" : "claim.submitted"
    await writeAudit(ctx, {
      userId: subject._id,
      event,
      meta: { claimId, claimantUserId: claimant._id },
      at: now,
    })
    // The notification kind mirrors the audit event: an owner inside a lockout
    // window must be able to tell "someone tried again and was blocked" from
    // "a claim is now running against your vault".
    await notify(ctx, subject._id, event, { claimId })
    return { received: true }
  },
})

/** What the claimant sees about their own claims. Never anyone else's. */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const claimant = await getCurrentUserOrThrow(ctx)
    const rows = await ctx.db
      .query("claims")
      .withIndex("by_claimantUserId", (q) =>
        q.eq("claimantUserId", claimant._id)
      )
      .take(20)
    return rows.map((row) => ({
      id: row._id,
      status: row.status,
      vetoDeadline: row.vetoDeadline ?? null,
      lockedUntil: row.lockedUntil ?? null,
      submittedAt: row._creationTime,
    }))
  },
})

/** What the owner sees: claims filed against their own vault. */
export const againstMe = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const rows = await ctx.db
      .query("claims")
      .withIndex("by_subjectUserId", (q) => q.eq("subjectUserId", user._id))
      .take(20)
    return rows.map((row) => ({
      id: row._id,
      status: row.status,
      claimantName: row.claimantName,
      vetoDeadline: row.vetoDeadline ?? null,
      canVeto: row.status === "awaiting_veto",
      submittedAt: row._creationTime,
    }))
  },
})

/**
 * The owner says "I am alive." Locks the claimant out for 90 days and stops the
 * release cold. Only reachable while the claim is in its veto window — after
 * the deadline the scheduler has already released and there is nothing to undo.
 */
export const veto = mutation({
  args: { claimId: v.id("claims") },
  handler: async (ctx, { claimId }) => {
    const user = await requireUser(ctx)
    const claim = await ctx.db.get("claims", claimId)
    if (claim === null || claim.subjectUserId !== user._id) {
      throw new Error("Not found")
    }
    if (claim.status !== "awaiting_veto") {
      throw new Error("This claim is not in its veto window")
    }

    const now = Date.now()
    if (claim.vetoDeadline !== undefined && claim.vetoDeadline <= now) {
      throw new Error("The veto window has closed")
    }

    await ctx.db.patch("claims", claimId, {
      status: "vetoed",
      lockedUntil: now + VETO_LOCKOUT_DAYS * DAY_MS,
    })
    await writeAudit(ctx, {
      userId: user._id,
      event: "claim.vetoed",
      meta: { claimId, lockoutDays: VETO_LOCKOUT_DAYS },
      at: now,
    })
    if (claim.claimantUserId !== undefined) {
      await notify(ctx, claim.claimantUserId, "claim.vetoed", { claimId })
    }
    return null
  },
})

/**
 * The guardian's confirmation — the human check between paperwork and release.
 * Starts the veto clock; it does not release anything itself.
 */
export const guardianConfirm = mutation({
  args: { claimId: v.id("claims") },
  handler: async (ctx, { claimId }) => {
    const claim = await ctx.db.get("claims", claimId)
    if (claim === null) {
      throw new Error("Not found")
    }
    await requireAcceptedGuardian(ctx, claim.subjectUserId)

    if (claim.status !== "guardian_review") {
      throw new Error("This claim is not awaiting guardian confirmation")
    }
    if (claim.heirId === undefined) {
      throw new Error("This claim is not linked to an heir record yet")
    }

    const now = Date.now()
    const vetoDeadline = now + VETO_WINDOW_DAYS * DAY_MS
    await ctx.db.patch("claims", claimId, {
      status: "awaiting_veto",
      guardianConfirmedAt: now,
      vetoDeadline,
    })
    await writeAudit(ctx, {
      userId: claim.subjectUserId,
      event: "claim.guardian_confirmed",
      meta: { claimId, vetoDeadline },
      at: now,
    })
    // The owner's last chance to say they are alive.
    await notify(ctx, claim.subjectUserId, "claim.veto_window_open", {
      claimId,
      vetoDeadline,
    })
    return null
  },
})

/** Admin review queue for apps/admin. */
export const pendingReview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const rows = await ctx.db
      .query("claims")
      .withIndex("by_status", (q) => q.eq("status", "submitted"))
      .take(100)
    return await Promise.all(
      rows.map(async (row) => {
        const subject = await ctx.db.get("users", row.subjectUserId)
        return {
          id: row._id,
          claimantName: row.claimantName,
          claimantIdentityStatus: row.claimantIdentityStatus,
          certificateName: row.certificateName ?? null,
          certificateUrl:
            row.certificateStorageId === undefined
              ? null
              : await ctx.storage.getUrl(row.certificateStorageId),
          subjectVerifiedName: subject?.identityVerifiedName ?? null,
          heirId: row.heirId ?? null,
          submittedAt: row._creationTime,
        }
      })
    )
  },
})

/**
 * The admin's judgement on whether the death certificate names the same person
 * as the owner's verified legal identity. Never a string comparison in code:
 * transliteration, honorifics and name order make that unsafe in Arabic and in
 * every other script this ships to.
 */
export const adminSetNameMatch = mutation({
  args: { claimId: v.id("claims"), nameMatch: v.boolean() },
  handler: async (ctx, { claimId, nameMatch }) => {
    const admin = await requireAdmin(ctx)
    const claim = await ctx.db.get("claims", claimId)
    if (claim === null) {
      throw new Error("Not found")
    }
    if (claim.status !== "submitted") {
      throw new Error("This claim is past review")
    }

    // Re-read the claimant's live verification status rather than trusting the
    // copy taken at submit time — Didit may have landed since.
    const claimant =
      claim.claimantUserId === undefined
        ? null
        : await ctx.db.get("users", claim.claimantUserId)
    const claimantIdentityStatus = claimant?.identityStatus ?? "unverified"
    const status = nameMatchOutcome(nameMatch, claimantIdentityStatus)

    await ctx.db.patch("claims", claimId, {
      nameMatch,
      claimantIdentityStatus,
      status,
    })
    await writeAudit(ctx, {
      userId: claim.subjectUserId,
      event: "claim.name_match_set",
      meta: { claimId, nameMatch, status, adminUserId: admin._id },
    })
    return { status }
  },
})

/** Bind a claimant to the heir record whose bundle they would receive. */
export const adminLinkHeir = mutation({
  args: { claimId: v.id("claims"), heirId: v.id("heirs") },
  handler: async (ctx, { claimId, heirId }) => {
    const admin = await requireAdmin(ctx)
    const claim = await ctx.db.get("claims", claimId)
    if (claim === null) {
      throw new Error("Not found")
    }
    const heir = await ctx.db.get("heirs", heirId)
    if (heir === null || heir.userId !== claim.subjectUserId) {
      throw new Error("That heir belongs to a different vault")
    }
    if (claim.status === "released") {
      throw new Error("This claim has already been released")
    }

    await ctx.db.patch("claims", claimId, { heirId })
    await writeAudit(ctx, {
      userId: claim.subjectUserId,
      event: "claim.heir_linked",
      meta: { claimId, heirId, adminUserId: admin._id },
    })
    return null
  },
})

/**
 * Scheduler-driven. The only transition that happens without a human: a claim
 * whose veto window has run out becomes `released`. Time is the sole guard —
 * every other precondition was already checked on the way into `awaiting_veto`.
 *
 * No cursor, on purpose. The index is keyed on `status`, so releasing a claim
 * removes it from this query's range; each pass therefore drains strictly, and
 * every row in the window is releasable by construction. A `gt(vetoDeadline)`
 * cursor would be worse than useless here — it would permanently skip a claim
 * that happened to share a deadline millisecond with the batch boundary, and an
 * inheritance that never releases is the failure this whole file exists to
 * prevent.
 */
export const advance = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const due = await ctx.db
      .query("claims")
      .withIndex("by_status_and_vetoDeadline", (q) =>
        q.eq("status", "awaiting_veto").lte("vetoDeadline", now)
      )
      .take(ADVANCE_BATCH)

    let released = 0
    for (const claim of due) {
      if (!vetoWindowElapsed(claim, now)) {
        continue
      }
      await ctx.db.patch("claims", claim._id, { status: "released" })
      await writeAudit(ctx, {
        userId: claim.subjectUserId,
        event: "claim.released",
        meta: { claimId: claim._id, heirId: claim.heirId ?? null },
        at: now,
      })
      if (claim.claimantUserId !== undefined) {
        await notify(ctx, claim.claimantUserId, "claim.released", {
          claimId: claim._id,
        })
      }
      released += 1
    }

    // Only continue on real progress, so a batch that released nothing cannot
    // reschedule itself in a loop.
    if (released === ADVANCE_BATCH) {
      await ctx.scheduler.runAfter(0, internal.claims.advance, {})
    }
    return { scanned: due.length, released }
  },
})

async function assertUnderRateLimit(
  ctx: MutationCtx,
  claimantUserId: Id<"users">,
  now: number
): Promise<void> {
  const recent = await ctx.db
    .query("claims")
    .withIndex("by_claimantUserId", (q) =>
      q.eq("claimantUserId", claimantUserId)
    )
    .order("desc")
    .take(CLAIM_RATE_LIMIT + 1)
  const inWindow = recent.filter(
    (claim) => now - claim._creationTime < CLAIM_RATE_WINDOW_MS
  )
  if (inWindow.length >= CLAIM_RATE_LIMIT) {
    throw new Error("Too many claims filed recently. Try again tomorrow.")
  }
}

async function notify(
  ctx: MutationCtx,
  userId: Id<"users">,
  kind: string,
  payload: Record<string, string | number | boolean | null>
): Promise<void> {
  await ctx.db.insert("notifications", { userId, kind, payload })
}

export type Claim = Doc<"claims">
