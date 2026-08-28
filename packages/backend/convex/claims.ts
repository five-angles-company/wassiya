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
  nameMatchBlockedReason,
  nameMatchOutcome,
  vetoWindowElapsed,
} from "./model/claimFlow"
import { sendGuardianClaimNotice } from "./email"
import { getCurrentUserOrThrow } from "./users"

/**
 * Whether a guardian has anywhere to go when told a claim is waiting.
 *
 * **They do not.** Guardians act in the web app, which has not shipped:
 * `guardianConfirm`, `guardians.accept` and `guardians.pendingApprovals` have
 * no caller in any app. So approval used to send a real person a real email —
 * *"open the Wassiya website to review it"* — pointing at a route that does not
 * exist, about a death they may not yet have heard of, with nothing they could
 * do on arrival. Silence is the better of those two.
 *
 * It also made the console lie. The review screen tells the reviewer in words
 * that approving sends no notification (`guardianGapBody` in
 * `apps/admin/features/claims/strings/claims.ts`), while this sent one. The
 * screen was right about what should happen; this is the code catching up.
 *
 * Flip to `true` in the same commit that ships the guardian's route. The
 * notification and the mail are written and correct — they are waiting only on
 * somewhere to point.
 */
const GUARDIAN_CAN_ACT = false

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
      searchText: searchTextFor({
        claimantName: args.claimantName,
        claimantContact: args.claimantContact,
        certificateName: args.certificateName,
      }),
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
    // Re-read the claimant's live verification status rather than trusting the
    // copy taken at submit time — Didit may have landed since.
    const claimant =
      claim.claimantUserId === undefined
        ? null
        : await ctx.db.get("users", claim.claimantUserId)
    const claimantIdentityStatus = claimant?.identityStatus ?? "unverified"

    // Two ways an approval silently destroys a legitimate claim, refused here
    // rather than absorbed. `nameMatchBlockedReason` is the same predicate the
    // console disables its button on, so the two cannot disagree — see its
    // header for why each case exists and why neither applies to a rejection.
    const blocked = nameMatchBlockedReason(
      claim,
      nameMatch,
      claimantIdentityStatus
    )
    if (blocked === "past-review") {
      throw new Error("This claim is past review")
    }
    if (blocked === "no-heir") {
      throw new Error(
        "Link an heir before approving: the guardian cannot confirm a claim with no heir record."
      )
    }
    if (blocked === "identity-not-verified") {
      throw new Error(
        "The claimant is not identity-verified, so approving would lock this claim permanently. Wait for verification."
      )
    }

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

    // Tell the guardian, because until now this transition told nobody.
    //
    // Every other transition in this file notifies someone — `submit` the
    // owner, `veto` the claimant, `guardianConfirm` the owner, `advance` the
    // claimant. This one wrote an audit line and stopped, which meant a claim
    // could land in `guardian_review` and sit there until a guardian happened
    // to open the app and look. Both channels, for the same reason the check-in
    // ladder uses both: the in-app row is for a guardian who opens the app, and
    // the email is for the one who does not.
    //
    // Only on approval. A rejection ends the claim, and there is nothing to ask
    // a guardian about a claim that is already closed.
    if (status === "guardian_review" && GUARDIAN_CAN_ACT) {
      const guardians = await ctx.db
        .query("guardians")
        .withIndex("by_userId", (q) => q.eq("userId", claim.subjectUserId))
        .take(20)
      for (const guardian of guardians) {
        // Accepted **and** linked to an account. An invited guardian has no
        // `guardianUserId` to notify, and a revoked one is no longer anyone's
        // guardian — `guardianConfirm` would refuse them either way.
        if (guardian.status !== "accepted") continue
        if (guardian.guardianUserId === undefined) continue
        await notify(ctx, guardian.guardianUserId, "claim.guardian_review", {
          claimId,
        })
        await sendGuardianClaimNotice(ctx, guardian.guardianUserId)
      }
    }

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

/**
 * The one string the console's search index searches.
 *
 * A Convex search index has exactly one `searchField`, so the three things an
 * operator might type — a claimant's name, the email or phone they filed with,
 * and the name on the death certificate — are joined into one column. Every
 * writer of any of the three must call this; there is no trigger to catch a
 * caller who forgets, and a stale value fails silently as "no results".
 *
 * Not security-sensitive and not new disclosure: all three fields are already
 * readable by the same admin queries that read this one.
 */
export function searchTextFor(parts: {
  claimantName: string
  claimantContact: string
  certificateName?: string | undefined
}): string {
  return [parts.claimantName, parts.claimantContact, parts.certificateName]
    .filter((part): part is string => part !== undefined && part.length > 0)
    .join(" ")
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

/**
 * ٧.٤ — the status page, read with no account.
 *
 * The board's requirement: *"Signed-URL access with the claim id, no account —
 * but the URL alone reveals nothing beyond status."* The claim id is therefore
 * a **capability**: holding it is what grants the read, exactly as holding the
 * emailed link does. Convex ids are 32 random characters, so guessing one is
 * not a practical attack; forwarding one to a relative is, and is intended —
 * the board notes this page gets forwarded and re-opened for weeks.
 *
 * ## What this deliberately does NOT return
 *
 * Every field below is either the claimant's own submission or a date they were
 * already told. Absent, on purpose:
 *
 *  - `claimantContact` and `claimantName` — an id-holder who is not the
 *    claimant would otherwise learn who filed and how to reach them.
 *  - `subjectUserId` and anything about the deceased's account, including
 *    whether one exists. `claims.submit` is careful to answer uniformly so it
 *    is not an oracle; this must not undo that.
 *  - `certificateName`, `nameMatch`, `heirId` — review internals. A claimant
 *    learning that name matching failed would learn how to make it pass.
 *  - Anything at all about the vault's contents.
 *
 * What is left is a status, two dates and a reference, which is precisely the
 * "radical transparency" the screen asks for and nothing more.
 */
export const publicStatus = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, { claimId }) => {
    const claim = await ctx.db.get("claims", claimId)
    if (claim === null) return null
    return {
      id: claim._id,
      status: claim.status,
      submittedAt: claim._creationTime,
      vetoDeadline: claim.vetoDeadline ?? null,
      // Whether the identity check passed is the claimant's own result and the
      // thing they are most likely to be waiting on.
      identityVerified: claim.claimantIdentityStatus === "verified",
      certificateReceived: claim.certificateStorageId !== undefined,
      // `undefined`, not `null` — the column is `v.optional(v.number())`, and
      // comparing it against null reports every claim as confirmed.
      guardianConfirmed: claim.guardianConfirmedAt !== undefined,
    }
  },
})

/**
 * Upload target for a death certificate.
 *
 * Separate from `assets.generateUploadUrl` on purpose, even though the two are
 * one line apart in behaviour. A certificate is **third-party personal data**
 * about someone who cannot consent — the board is explicit that it must be
 * restricted to the review queue and deleted on a schedule if the claim fails —
 * so it must not be indistinguishable from an owner's own vault upload in the
 * code, the audit log, or a future retention sweep.
 *
 * Unlike everything else the vault stores, this blob is **not** encrypted by
 * the client: a human reviewer has to read it, and the claimant has no key to
 * encrypt it with that a reviewer could also open. That makes it the one piece
 * of plaintext personal data this deployment holds, and the reason the
 * retention rule exists.
 */
export const generateCertificateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Authenticated: an anonymous upload URL would be an open file drop.
    await getCurrentUserOrThrow(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

/**
 * Attach the death certificate to a claim already filed.
 *
 * ٧.٢ files the claim and ٧.٣ uploads the certificate, which are separate
 * screens minutes apart — so the certificate cannot be an argument to `submit`
 * in the web funnel, even though `submit` accepts one for callers that have it
 * up front.
 *
 * Narrow on purpose: re-calling
 * `submit` to carry the certificate would need the caller to resend the
 * subject's email and their own details, and getting any of them wrong would
 * silently file nothing — `submit` answers `{ received: true }` either way,
 * because it must not be an enumeration oracle. A mutation that takes only a
 * claim id and a file cannot fail that way.
 *
 * Only the claimant who filed it, and only while it is still open: a released
 * or vetoed claim's certificate is evidence of what was decided, and must not
 * be swapped afterwards.
 */
export const attachCertificate = mutation({
  args: {
    claimId: v.id("claims"),
    certificateStorageId: v.id("_storage"),
    certificateName: v.string(),
  },
  handler: async (ctx, args) => {
    const claimant = await getCurrentUserOrThrow(ctx)
    const claim = await ctx.db.get("claims", args.claimId)
    if (claim === null || claim.claimantUserId !== claimant._id) {
      throw new Error("Not found")
    }
    if (claim.status !== "submitted") {
      throw new Error("This claim is no longer accepting documents")
    }
    if (args.certificateName.trim().length === 0) {
      throw new Error("The name on the certificate is required")
    }

    await ctx.db.patch("claims", args.claimId, {
      certificateStorageId: args.certificateStorageId,
      certificateName: args.certificateName.trim(),
      // Rebuilt, not appended to: the certificate name is arriving now, and a
      // stale `searchText` would leave the console unable to find a claim by
      // the very document it is being reviewed against.
      searchText: searchTextFor({
        claimantName: claim.claimantName,
        claimantContact: claim.claimantContact,
        certificateName: args.certificateName.trim(),
      }),
    })
    await writeAudit(ctx, {
      userId: claim.subjectUserId,
      event: "claim.certificate_attached",
      // The name is deliberately not logged: it is third-party personal data
      // about the deceased, and the audit line only needs to record that a
      // document arrived.
      meta: { claimId: args.claimId, claimantUserId: claimant._id },
    })
    return null
  },
})
