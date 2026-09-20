// Death reports — the path that ends in releasing an inheritance.
//
// The transition table lives in `model/claimFlow.ts`. Nothing here moves a
// claim except through those guards, and the release action re-checks
// `status === "released"` on its own rather than trusting this file.
//
// A report reaches `released` only when the reporter is Didit-verified, the
// death certificate's name matches the owner's verified legal name (an admin's
// judgement, never a string comparison), and the veto window has elapsed with
// no veto. What each heir then receives is a `deliveries` row, with its own
// identity gate — the reporter receives nothing by reporting.
import { v } from "convex/values"

import { internal } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server"
import { writeAudit, writeStaffAudit } from "./audit"
import { createDeliveriesForClaim } from "./deliveries"
import { requirePermission, requireUser } from "./model/access"
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
import {
  sendClaimClosed,
  sendClaimFiled,
  sendClaimInReview,
  sendClaimReleased,
  sendClaimReviewFailed,
  sendClaimVetoed,
} from "./email"
import { recordJobRun } from "./model/jobRuns"
import { getCurrentUserOrThrow } from "./users"

const ADVANCE_BATCH = 50

/**
 * How long an unmatched claim waits for a human before the sweep closes it.
 *
 * Long enough that staff can realistically link a mistyped address, and long
 * enough that the eventual "no vault matched" is not a fast oracle. See
 * `sweepUnmatched`.
 */
const UNMATCHED_GRACE_DAYS = 7

/**
 * The vault a claim is against, asserted rather than assumed.
 *
 * `subjectUserId` is optional because a claim filed against an address with no
 * vault is a real claim — see the schema. But it is optional only in the one
 * state that can hold it: `submitted`, before review. Every path past that
 * point needs a subject and cannot sensibly continue without one, so each
 * asserts it here rather than threading `| undefined` through code whose whole
 * job is authorisation.
 *
 * Throws the same opaque "Not found" the guarded paths already use for every
 * other refusal, so an unmatched claim is indistinguishable from a missing one
 * to anyone probing.
 */
export function requireSubject(claim: Doc<"claims">): Id<"users"> {
  const subjectUserId = claim.subjectUserId
  if (subjectUserId === undefined) {
    throw new Error("Not found")
  }
  return subjectUserId
}

/**
 * The only thing allowed to write a claim.
 *
 * It exists for one field. `updatedAt` has no trigger — Convex has none — so a
 * writer that forgets it leaves a row whose "last moved" is a lie, and nothing
 * anywhere fails. That is the same trap `searchText` documents on the schema,
 * and it was already loose once.
 *
 * So the stamp is not something a caller remembers: it is the price of writing
 * at all. `scripts/verify-invariants.mjs` fails the build on any
 * `ctx.db.patch("claims", …)` outside this function, which is what stops the
 * next writer quietly reintroducing the problem.
 *
 * `now` is passed where the caller already has one, so the timestamp on the row
 * matches the one in its audit line rather than being a millisecond apart.
 *
 * Pass `null` to write **without** stamping. That is for a backfill — filling a
 * column that was always implicitly true — and nothing else. A state change that
 * skipped the stamp would be the exact bug this function exists to prevent, so
 * the opt-out is explicit at the call site rather than a default.
 */
export async function patchClaim(
  ctx: MutationCtx,
  claimId: Id<"claims">,
  fields: Partial<Doc<"claims">>,
  now: number | null = Date.now()
): Promise<void> {
  await ctx.db.patch(
    "claims",
    claimId,
    now === null ? fields : { ...fields, updatedAt: now }
  )
}

/**
 * File a claim against a vault.
 *
 * The claimant must be signed in: identity verification is mandatory for heirs
 * at claim time anyway, and an account is what makes the rate limit and the
 * 90-day lockout attach to a person rather than to a typed-in string.
 *
 * ## It always creates a claim, and returns its id
 *
 * It used to insert nothing when the address matched no vault, and answer
 * `{ received: true }` either way, so that an honest "no such vault" could not
 * become an email-enumeration oracle. The cost was paid by the wrong person: a
 * bereaved claimant filled in the form and was then shown a list reading "no
 * reports yet", with no way to tell a typo from a vault that never existed.
 *
 * The defence was also not working. A miss inserted no row, and
 * `assertUnderRateLimit` counts rows — so probing addresses that have no vault
 * was free and unlimited, while a *hit* produced a row visible in `mine`
 * seconds later. The oracle already existed; it was just delayed by one
 * navigation, and the rate limit capped only the case nobody needed to cap.
 *
 * So: always insert, and let `subjectUserId` be absent. The claimant gets a
 * reference and a page; the rate limit now counts every attempt, which is the
 * first time it has actually limited enumeration; and nothing in the response
 * distinguishes a match from a miss — the first two steps of the funnel are
 * identical either way, and `sweepUnmatched` is what eventually says so, by
 * email, days later.
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

    // Normalised here, not in the form. The web client lowercases already, but
    // it is not the only possible caller, and a stray capital used to mean a
    // real vault silently did not match.
    const subjectEmail = args.subjectEmail.trim().toLowerCase()

    const subject = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", subjectEmail))
      .unique()

    // Claiming against yourself is not an information leak to refuse loudly:
    // you already know whether you have a vault.
    if (subject !== null && subject._id === claimant._id) {
      throw new Error("You cannot file a report against your own vault.")
    }

    // Keyed on the person and the address, not on the typed contact string. The
    // old key let a vetoed claimant walk around their own 90-day bar by
    // entering a different phone number, and it could not index an unmatched
    // claim at all.
    const prior = await ctx.db
      .query("claims")
      .withIndex("by_claimantUserId_and_subjectEmail", (q) =>
        q.eq("claimantUserId", claimant._id).eq("subjectEmail", subjectEmail)
      )
      .take(20)

    // An open claim already exists — do not stack a second one on it. The
    // claimant gets the id of the one they already have rather than silence:
    // this is the ordinary "I refreshed and filed twice" case, and pretending
    // nothing happened is what sent people back to an empty list.
    const open = prior.find(
      (claim) =>
        claim.status === "submitted" || claim.status === "awaiting_veto"
    )
    if (open !== undefined) {
      return { claimId: open._id }
    }

    // A veto within the last 90 days bars this claimant. The attempt is still
    // recorded — as a `locked` claim — because a barred attempt is exactly the
    // kind of thing the owner and the audit log should see.
    const lockout = prior.find((claim) => isLockedOut(claim, now))
    const barred = lockout !== undefined

    const claimId = await ctx.db.insert("claims", {
      // Absent when nothing matched. That is the whole point: a filing always
      // produces a claim now, so the claimant has a reference and a page, and
      // staff have something to resolve.
      subjectUserId: subject?._id,
      subjectEmail,
      claimantName: args.claimantName,
      claimantContact: args.claimantContact,
      claimantUserId: claimant._id,
      claimantIdentityStatus: claimant.identityStatus ?? "unverified",
      certificateStorageId: args.certificateStorageId,
      certificateName: args.certificateName,
      status: barred ? "locked" : "submitted",
      lockedUntil: barred ? lockout.lockedUntil : undefined,
      closedReason: barred ? "review_failed" : undefined,
      closedAt: barred ? now : undefined,
      updatedAt: now,
      searchText: searchTextFor({
        claimantName: args.claimantName,
        claimantContact: args.claimantContact,
        certificateName: args.certificateName,
      }),
    })

    // The owner is told only when there is an owner. An unmatched claim names
    // nobody's vault, so there is no one to notify and no log to write to —
    // `sweepUnmatched` closes it, or staff link it and the history starts then.
    if (subject !== null) {
      const event = barred ? "claim.blocked_by_lockout" : "claim.submitted"
      await writeAudit(ctx, {
        userId: subject._id,
        event,
        meta: { claimId, claimantUserId: claimant._id },
        at: now,
      })
      // The notification kind mirrors the audit event: an owner inside a
      // lockout window must be able to tell "someone tried again and was
      // blocked" from "a claim is now running against your vault".
      await notify(ctx, subject._id, event, {}, claimId)
    }

    // The claimant's receipt, and the reason this mutation stopped being silent.
    //
    // Not on a barred attempt. A `locked` claim is one the 90-day veto bar
    // already refused, and "we have your report and review has started" would
    // be false. That claimant was told at veto time, including how long the bar
    // runs; saying it again here would be the app pretending not to remember.
    if (!barred) {
      await notify(ctx, claimant._id, "claim.filed", {}, claimId)
      await sendClaimFiled(ctx, claimant._id, claimId)
    }

    // The id, which the old contract withheld. It is the claimant's own claim,
    // and `publicStatus` is written to be forwarded — so this discloses nothing
    // to them that the next screen would not. What it stops is the thing that
    // sent a bereaved person to a page reading "no reports yet".
    return { claimId }
  },
})

/**
 * Whether this person has any claims at all, and the most recent one.
 *
 * Deliberately lean, because it runs on **every page**: `use-nav-groups` calls
 * it on each navigation purely to learn whether the list is non-empty. Putting
 * the per-row subject joins that `mine` now does onto that path would pay for a
 * name lookup per claim, on every screen, to answer a yes/no question.
 */
export const mineSummary = query({
  args: {},
  handler: async (ctx) => {
    const claimant = await getCurrentUserOrThrow(ctx)
    const rows = await ctx.db
      .query("claims")
      .withIndex("by_claimantUserId", (q) =>
        q.eq("claimantUserId", claimant._id)
      )
      .order("desc")
      .take(20)
    const latest = rows[0]
    return {
      count: rows.length,
      latestId: latest?._id ?? null,
      latestStatus: latest?.status ?? null,
    }
  },
})

/**
 * What the claimant sees about their own claims. Never anyone else's.
 *
 * `subjectName` is joined per row because without it a case list can only say
 * "C-4482", and a delivery list beside it — which has always carried names —
 * would read half-named. It is no new disclosure: `publicStatus` already hands
 * the same field to anyone holding the id, with no account at all.
 *
 * Bounded at 20 with the join inside that bound, so this is at most 20 extra
 * document reads. Use `mineSummary` on any path that only needs a count.
 */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const claimant = await getCurrentUserOrThrow(ctx)
    const rows = await ctx.db
      .query("claims")
      .withIndex("by_claimantUserId", (q) =>
        q.eq("claimantUserId", claimant._id)
      )
      .order("desc")
      .take(20)
    return await Promise.all(
      rows.map(async (row) => {
        const subject =
          row.subjectUserId === undefined
            ? null
            : await ctx.db.get("users", row.subjectUserId)
        return {
          id: row._id,
          subjectName: subject?.name ?? null,
          status: row.status,
          vetoDeadline: row.vetoDeadline ?? null,
          lockedUntil: row.lockedUntil ?? null,
          certificateReceived: row.certificateStorageId !== undefined,
          submittedAt: row._creationTime,
          updatedAt: row.updatedAt ?? row._creationTime,
        }
      })
    )
  },
})

/**
 * One case, for the person whose case it is.
 *
 * The claimant-gated twin of `publicStatus`, and the reason both exist:
 * `publicStatus` is written to be forwarded — its header is a list of things it
 * must never return, because anyone holding the id can read it. Widening it to
 * serve the case page would dismantle that. This one is gated instead, so it can
 * be generous.
 *
 * It also makes `isMine` a server fact. The page currently derives ownership by
 * scanning `mine`'s `take(20)` for a matching id, which silently reports "not
 * mine" to anyone past twenty claims — and then hides their own actions from
 * them.
 *
 * ⚠️ `identityStatus` is the **live** value from the claimant's own user row,
 * never `claim.claimantIdentityStatus`, which is a snapshot. Someone who files
 * and then verifies sits between the two, and a page that branched on the
 * snapshot would render the identity step as outstanding while the panel inside
 * it reported "verified" — an ask that answers itself, with the certificate step
 * never appearing behind it. See `model/claimFlow.ts`.
 *
 * Returns `null` rather than throwing for a bad or foreign id: this backs a page
 * reached from an emailed link, and mail clients truncate them.
 *
 * Never returns `nameMatch` or `staffNote` — the same exclusions
 * `publicStatus` states, for the same reason.
 */
export const forClaimant = query({
  args: { claimId: v.string() },
  handler: async (ctx, { claimId }) => {
    const claimant = await getCurrentUserOrThrow(ctx)
    const id = ctx.db.normalizeId("claims", claimId)
    if (id === null) return null
    const claim = await ctx.db.get("claims", id)
    if (claim === null || claim.claimantUserId !== claimant._id) return null

    const subject =
      claim.subjectUserId === undefined
        ? null
        : await ctx.db.get("users", claim.subjectUserId)
    return {
      id: claim._id,
      subjectName: subject?.name ?? null,
      status: claim.status,
      identityStatus: claimant.identityStatus ?? "unverified",
      certificateReceived: claim.certificateStorageId !== undefined,
      certificateName: claim.certificateName ?? null,
      vetoDeadline: claim.vetoDeadline ?? null,
      lockedUntil: claim.lockedUntil ?? null,
      submittedAt: claim._creationTime,
      updatedAt: claim.updatedAt ?? claim._creationTime,
      certificateAttachedAt: claim.certificateAttachedAt ?? null,
      reviewedAt: claim.reviewedAt ?? null,
      releasedAt: claim.releasedAt ?? null,
      closedAt: claim.closedAt ?? null,
    }
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

    await patchClaim(
      ctx,
      claimId,
      {
        status: "vetoed",
        lockedUntil: now + VETO_LOCKOUT_DAYS * DAY_MS,
        closedAt: now,
      },
      now
    )
    await writeAudit(ctx, {
      userId: user._id,
      event: "claim.vetoed",
      meta: { claimId, lockoutDays: VETO_LOCKOUT_DAYS },
      at: now,
    })
    if (claim.claimantUserId !== undefined) {
      await notify(ctx, claim.claimantUserId, "claim.vetoed", {}, claimId)
      await sendClaimVetoed(ctx, claim.claimantUserId, claimId)
    }
    return null
  },
})

/**
 * Attach a vault to a claim that matched none.
 *
 * The ordinary cause is a typo — an heir types the address the deceased used
 * from memory, or off a printed sheet, and gets one character wrong. Before
 * this there was nothing to repair: the filing created no row at all, so the
 * claimant simply waited forever on a claim that did not exist.
 *
 * Only ever *adds* a subject, never changes one. Re-pointing a claim that is
 * already against a vault would move a live review from one person's estate to
 * another's, and every audit line already written for it would be filed under
 * the wrong owner.
 */
export const adminLinkSubject = mutation({
  args: { claimId: v.id("claims"), subjectUserId: v.id("users") },
  handler: async (ctx, { claimId, subjectUserId }) => {
    const actor = await requirePermission(ctx, "claims.rule")
    const claim = await ctx.db.get("claims", claimId)
    if (claim === null) {
      throw new Error("Not found")
    }
    if (claim.subjectUserId !== undefined) {
      throw new Error("This claim is already attached to a vault")
    }
    if (claim.status !== "submitted") {
      throw new Error("Only an open claim can be attached to a vault")
    }
    const subject = await ctx.db.get("users", subjectUserId)
    if (subject === null) {
      throw new Error("Not found")
    }
    if (subject._id === claim.claimantUserId) {
      throw new Error("A claimant cannot be the subject of their own claim")
    }

    await patchClaim(ctx, claimId, { subjectUserId })

    // The owner's history starts here rather than at submit, because until now
    // there was no owner for it to belong to.
    await writeStaffAudit(ctx, {
      actor,
      subject: subjectUserId,
      event: "claim.subject_linked",
      meta: { claimId },
    })
    await notify(ctx, subjectUserId, "claim.submitted", {}, claimId)
    return null
  },
})

/**
 * End a claim without a verdict.
 *
 * Distinct from rejecting one. `adminSetNameMatch(false)` is a *ruling* — it
 * locks the claimant out for 90 days — and it needs a vault to rule about. This
 * is for a claim that cannot be ruled on at all: no vault matched and staff
 * cannot find one. It carries no bar, because the commonest cause is a mistyped
 * address and the right next step is to file again with the right one.
 *
 * `staffNote` is written here and never leaves the console.
 */
export const adminCloseClaim = mutation({
  args: { claimId: v.id("claims"), staffNote: v.optional(v.string()) },
  handler: async (ctx, { claimId, staffNote }) => {
    const actor = await requirePermission(ctx, "claims.rule")
    const claim = await ctx.db.get("claims", claimId)
    if (claim === null) {
      throw new Error("Not found")
    }
    if (claim.status !== "submitted") {
      throw new Error("Only an open claim can be closed")
    }

    const now = Date.now()
    await patchClaim(
      ctx,
      claimId,
      {
        status: "closed",
        closedReason: "no_vault_matched",
        closedAt: now,
        staffNote,
      },
      now
    )
    if (claim.subjectUserId !== undefined) {
      await writeStaffAudit(ctx, {
        actor,
        subject: claim.subjectUserId,
        event: "claim.closed",
        meta: { claimId },
        at: now,
      })
    }
    if (claim.claimantUserId !== undefined) {
      await notify(ctx, claim.claimantUserId, "claim.closed", {}, claimId)
      await sendClaimClosed(ctx, claim.claimantUserId, claimId)
    }
    return null
  },
})

/**
 * Close claims that matched no vault and that nobody resolved.
 *
 * The counterpart to `submit` always inserting: a claim that sits in
 * `submitted` with no subject forever is the old silent failure with a row
 * attached. After the grace window the claimant is told, by email, that no
 * process could be started from that address — which is the answer they came
 * for, and the thing the product could not say before.
 *
 * ⚠️ **This is the one place the product discloses whether an address has a
 * vault**, and it is deliberate. Weigh it against what it replaces: probing was
 * free, unlimited and instantly answered by an empty list. It now costs a
 * rate-limited slot out of three a day, is attributable to a Clerk account,
 * writes a row, and answers a week late. Strictly better on every axis — but it
 * is a disclosure, so the delay is not decorative and should not be shortened
 * without saying why.
 *
 * Batched and self-scheduling like `advance`, so a backlog cannot exceed one
 * transaction.
 */
export const sweepUnmatched = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const cutoff = now - UNMATCHED_GRACE_DAYS * DAY_MS

    const stale = await ctx.db
      .query("claims")
      .withIndex("by_status_and_subjectUserId", (q) =>
        q.eq("status", "submitted").eq("subjectUserId", undefined)
      )
      .take(ADVANCE_BATCH)

    let closed = 0
    for (const claim of stale) {
      if (claim._creationTime > cutoff) continue
      await patchClaim(
        ctx,
        claim._id,
        {
          status: "closed",
          closedReason: "no_vault_matched",
          closedAt: now,
        },
        now
      )
      if (claim.claimantUserId !== undefined) {
        await notify(ctx, claim.claimantUserId, "claim.closed", {}, claim._id)
        await sendClaimClosed(ctx, claim.claimantUserId, claim._id)
      }
      closed += 1
    }

    await recordJobRun(ctx, {
      name: "claims.sweepUnmatched",
      ranAt: now,
      scanned: stale.length,
      changed: closed,
      rescheduled: stale.length === ADVANCE_BATCH,
      continued: stale.length === ADVANCE_BATCH,
    })
    if (stale.length === ADVANCE_BATCH) {
      await ctx.scheduler.runAfter(0, internal.claims.sweepUnmatched, {})
    }
    return null
  },
})

/**
 * One-off: fill `subjectEmail` on claims filed before the column existed.
 *
 * Every pre-existing claim has a `subjectUserId` — filing against an unmatched
 * address used to insert nothing — so the address is recoverable from the
 * subject's own row.
 *
 * It matters because `subjectEmail` is now the dedupe and lockout key. A
 * vetoed claimant whose old claim has no email on it would not be found by
 * `by_claimantUserId_and_subjectEmail`, and would walk straight through their
 * own 90-day bar.
 *
 * Run once per deployment: `npx convex run claims:backfillSubjectEmail '{}'`.
 * Idempotent — it skips anything already filled — so running it twice is safe
 * and running it after a partial failure resumes.
 */
export const backfillSubjectEmail = internalMutation({
  args: {},
  handler: async (ctx) => {
    const batch = await ctx.db.query("claims").take(200)
    let filled = 0
    for (const claim of batch) {
      if (claim.subjectEmail !== undefined) continue
      if (claim.subjectUserId === undefined) continue
      const subject = await ctx.db.get("users", claim.subjectUserId)
      if (subject?.email == null) continue
      // `null` — no stamp. This fills a column that was always implicitly true
      // rather than moving the claim, and stamping `updatedAt` would tell every
      // case page that every old claim moved today.
      await patchClaim(
        ctx,
        claim._id,
        { subjectEmail: subject.email.trim().toLowerCase() },
        null
      )
      filled += 1
    }
    return { scanned: batch.length, filled }
  },
})

/** Admin review queue for apps/admin. */
export const pendingReview = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "claims.read")
    const rows = await ctx.db
      .query("claims")
      .withIndex("by_status", (q) => q.eq("status", "submitted"))
      .take(100)
    return await Promise.all(
      rows.map(async (row) => {
        const subject =
          row.subjectUserId === undefined
            ? null
            : await ctx.db.get("users", row.subjectUserId)
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
    const actor = await requirePermission(ctx, "claims.rule")
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

    // An unmatched claim has no vault to rule on. It is not rejected here —
    // `adminLinkSubject` is how a mistyped address gets attached to the right
    // vault, and `adminCloseClaim` is how one that cannot be resolved ends.
    const subjectUserId = claim.subjectUserId
    if (subjectUserId === undefined) {
      throw new Error(
        "This claim matched no vault. Link it to one, or close it — a verdict cannot be recorded against nothing."
      )
    }

    // `nameMatchBlockedReason` is the same predicate the console disables its
    // button on, so the two cannot disagree.
    const blocked = nameMatchBlockedReason(
      claim,
      nameMatch,
      claimantIdentityStatus
    )
    if (blocked === "past-review") {
      throw new Error("This claim is past review")
    }
    if (blocked === "identity-not-verified") {
      throw new Error(
        "The reporter is not identity-verified, so approving would lock this report permanently. Wait for verification."
      )
    }

    const status = nameMatchOutcome(nameMatch, claimantIdentityStatus)

    const reviewedAt = Date.now()
    const vetoDeadline =
      status === "awaiting_veto"
        ? reviewedAt + VETO_WINDOW_DAYS * DAY_MS
        : undefined
    await patchClaim(
      ctx,
      claimId,
      {
        nameMatch,
        claimantIdentityStatus,
        status,
        reviewedAt,
        vetoDeadline,
        // A rejection is terminal, so review is also when this claim closed.
        closedAt: status === "locked" ? reviewedAt : undefined,
      },
      reviewedAt
    )
    await writeStaffAudit(ctx, {
      actor,
      subject: subjectUserId,
      event: "claim.name_match_set",
      meta: { claimId, nameMatch, status },
    })

    // The owner's last chance to say they are alive — on every channel the
    // veto notification already uses.
    if (vetoDeadline !== undefined) {
      await notify(
        ctx,
        subjectUserId,
        "claim.veto_window_open",
        { vetoDeadline },
        claimId
      )
    }

    // The reporter, both ways. This is the review they have been waiting on and
    // the only transition a human decides, so silence here is the longest a
    // claim can go dark — and `locked` is terminal, which makes the rejection
    // the single most important message never to swallow.
    //
    // ⚠️ Neither message carries a reason. `claims.publicStatus` states why: a
    // claimant who learns *which* check failed learns how to make it pass.
    if (claim.claimantUserId !== undefined) {
      if (status === "awaiting_veto") {
        await notify(ctx, claim.claimantUserId, "claim.in_review", {}, claimId)
        await sendClaimInReview(
          ctx,
          claim.claimantUserId,
          claimId,
          vetoDeadline ?? reviewedAt
        )
      } else {
        await notify(
          ctx,
          claim.claimantUserId,
          "claim.review_failed",
          {},
          claimId
        )
        await sendClaimReviewFailed(ctx, claim.claimantUserId, claimId)
      }
    }

    return { status }
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
  /** See `checkin.sweep` — set by the reschedule, so only the first pass trims. */
  args: { continued: v.optional(v.boolean()) },
  handler: async (ctx, { continued }) => {
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
      await patchClaim(
        ctx,
        claim._id,
        { status: "released", releasedAt: now },
        now
      )
      // Unreachable: `awaiting_veto` is only entered through
      // `adminSetNameMatch`, which refuses a claim with no subject. Skipped
      // rather than thrown so one impossible row could never stall the sweep.
      if (claim.subjectUserId === undefined) continue
      const deliveries = await createDeliveriesForClaim(
        ctx,
        claim._id,
        claim.subjectUserId,
        now
      )
      await writeAudit(ctx, {
        userId: claim.subjectUserId,
        event: "claim.released",
        meta: { claimId: claim._id, deliveries },
        at: now,
      })
      if (claim.claimantUserId !== undefined) {
        await notify(ctx, claim.claimantUserId, "claim.released", {}, claim._id)
        await sendClaimReleased(ctx, claim.claimantUserId, claim._id)
      }
      released += 1
    }

    // Only continue on real progress, so a batch that released nothing cannot
    // reschedule itself in a loop.
    const rescheduled = released === ADVANCE_BATCH
    if (rescheduled) {
      await ctx.scheduler.runAfter(0, internal.claims.advance, {
        continued: true,
      })
    }

    // Written every pass, including the ones that release nothing. A veto
    // window that has not elapsed yet is the normal case, and the console has
    // to be able to tell that apart from a scheduler that has stopped.
    await recordJobRun(ctx, {
      name: "claims.advance",
      ranAt: now,
      scanned: due.length,
      changed: released,
      rescheduled,
      continued: continued === true,
    })

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

export async function notify(
  ctx: MutationCtx,
  userId: Id<"users">,
  kind: string,
  payload: Record<string, string | number | boolean | null>,
  claimId?: Id<"claims">
): Promise<void> {
  await ctx.db.insert("notifications", { userId, kind, payload, claimId })
}

export type Claim = Doc<"claims">

/**
 * ٧.٤ — the status page, read with no account.
 *
 * The requirement: *"Signed-URL access with the claim id, no account —
 * but the URL alone reveals nothing beyond status."* The claim id is therefore
 * a **capability**: holding it is what grants the read, exactly as holding the
 * emailed link does. Convex ids are 32 random characters, so guessing one is
 * not a practical attack; forwarding one to a relative is, and is intended —
 * this page is expected to be forwarded and re-opened for weeks.
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
 *  - `certificateName`, `nameMatch` — review internals. A claimant
 *    learning that name matching failed would learn how to make it pass.
 *  - Anything at all about the vault's contents.
 *
 * What is left is a status, two dates and a reference, which is precisely the
 * "radical transparency" the screen asks for and nothing more.
 */
export const publicStatus = query({
  // `v.string()` and normalised in the body, not `v.id("claims")`. This id
  // arrives from a path segment in an emailed link, and links get truncated by
  // mail clients and re-typed by hand — the argument validator would reject a
  // mangled one by *throwing*, which on the page someone re-opens weekly is a
  // crash rather than "we could not find this report".
  args: { claimId: v.string() },
  handler: async (ctx, { claimId: rawClaimId }) => {
    const claimId = ctx.db.normalizeId("claims", rawClaimId)
    if (claimId === null) return null

    const claim = await ctx.db.get("claims", claimId)
    if (claim === null) return null

    // Whose vault this is. The claimant knows who died — they filed against
    // this person's email — so naming them here reveals nothing they did not
    // bring, and it is what stops the page reading as a generic receipt.
    const subject =
      claim.subjectUserId === undefined
        ? null
        : await ctx.db.get("users", claim.subjectUserId)

    return {
      id: claim._id,
      subjectName: subject?.name ?? null,
      status: claim.status,
      submittedAt: claim._creationTime,
      vetoDeadline: claim.vetoDeadline ?? null,
      // Whether the identity check passed is the claimant's own result and the
      // thing they are most likely to be waiting on.
      identityVerified: claim.claimantIdentityStatus === "verified",
      certificateReceived: claim.certificateStorageId !== undefined,
    }
  },
})

/**
 * Upload target for a death certificate.
 *
 * Separate from `assets.generateUploadUrl` on purpose, even though the two are
 * one line apart in behaviour. A certificate is **third-party personal data**
 * about someone who cannot consent — it must be
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

    await patchClaim(ctx, args.claimId, {
      certificateAttachedAt: Date.now(),
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
    // The audit log is the **owner's** history, and an unmatched claim has no
    // owner — so there is no log for this line to belong to. The fact is not
    // lost: `certificateAttachedAt` is on the claim, and the claimant gets a
    // notification. Once staff link the claim to a vault, everything after that
    // point is audited normally.
    if (claim.subjectUserId !== undefined) {
      await writeAudit(ctx, {
        userId: claim.subjectUserId,
        event: "claim.certificate_attached",
        // The name is deliberately not logged: it is third-party personal data
        // about the deceased, and the audit line only needs to record that a
        // document arrived.
        meta: { claimId: args.claimId, claimantUserId: claimant._id },
      })
    }

    // In-app only, deliberately. The claimant is on the page as this lands, so
    // a mail would arrive about something they just watched happen. It is
    // recorded because the case history should show the document arriving, and
    // because "did my upload go through?" is a question people come back to ask.
    await notify(
      ctx,
      claimant._id,
      "claim.certificate_received",
      {},
      args.claimId
    )
    return null
  },
})
