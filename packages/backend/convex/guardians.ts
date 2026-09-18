// The guardian: the human check on a death claim, and the second holder of
// every heir's release key.
//
// **They are no longer part of recovery.** K_rec is the printed sheet alone, so
// a guardian holds one XOR share of K_h per heir and nothing of K_rec. Recovery
// is 1-of-1; release stays 2-of-2. See `packages/crypto/src/recovery.ts` for
// why storing the old guardian half server-side was the worse option.
//
// A guardian never holds MK. Their shares are sealed to their own X25519 key,
// which only their device can open. This deployment stores the sealed blobs and
// hands them back to that one guardian; it can read none of them.
//
// **Guardians live in the web app; mobile is the owner's app.** The owner-side
// functions here (`list`, `invite`, `revoke`) are called from mobile; every
// guardian-side one is called from web. See AGENTS.md.
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import type { Doc, Id } from "./_generated/dataModel"
import { mutation, query, type QueryCtx } from "./_generated/server"
import { writeAudit } from "./audit"
import { requireAcceptedGuardian, requireUser } from "./model/access"
import { DAY_MS } from "./model/claimFlow"
import { getCurrentUserOrThrow } from "./users"

const INVITE_TTL_MS = 7 * DAY_MS
const TOKEN_BYTES = 32

/** The owner's own guardian list. Public keys only — no sealed material here. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const rows = await ctx.db
      .query("guardians")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(50)
    return rows.map((row) => ({
      id: row._id,
      name: row.name,
      relation: row.relation,
      status: row.status,
      hasPublicKey: row.x25519PublicKey !== undefined,
      /**
       * The guardian's published X25519 **public** key, which the owner's
       * device needs in order to seal each heir's S_guardian_h to them.
       *
       * Safe to return: a public key is the half meant to be published, and
       * this deployment already stores it in the clear. What it cannot do is
       * open anything — the secret half never leaves the guardian's device, so
       * a server holding this key still cannot reconstruct any K_h.
       *
       * It is also what "live" now means. A guardian used to count once their
       * recovery share was sealed; that share is gone, so the published key is
       * the thing that makes a guardian usable — see `isGuardianLive`.
       */
      publicKey: row.x25519PublicKey ?? null,
      inviteExpiresAt: row.inviteExpiresAt,
    }))
  },
})

/**
 * Invite someone to be guardian. The token is the whole capability, so it is
 * generated here (never client-supplied) and expires in seven days.
 */
export const invite = mutation({
  args: { name: v.string(), relation: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const inviteToken = randomToken()
    const guardianId = await ctx.db.insert("guardians", {
      userId: user._id,
      name: args.name,
      relation: args.relation,
      status: "invited",
      inviteToken,
      inviteExpiresAt: Date.now() + INVITE_TTL_MS,
    })
    await writeAudit(ctx, {
      userId: user._id,
      event: "guardian.invited",
      meta: { guardianId, name: args.name },
    })
    // The token goes to the invitee out of band; it is returned once, here.
    return { guardianId, inviteToken }
  },
})

/**
 * Called by the *guardian's* own Clerk identity, not the owner's. Binds their
 * user id and the X25519 public key their device just generated — after this
 * the owner can seal shares to them.
 */
export const accept = mutation({
  args: { inviteToken: v.string(), x25519PublicKey: v.bytes() },
  handler: async (ctx, args) => {
    const guardianUser = await getCurrentUserOrThrow(ctx)
    const row = await ctx.db
      .query("guardians")
      .withIndex("by_inviteToken", (q) => q.eq("inviteToken", args.inviteToken))
      .unique()

    if (row === null || row.status === "revoked") {
      throw new Error("Invite not found")
    }
    if (row.inviteExpiresAt < Date.now()) {
      throw new Error("Invite has expired")
    }
    if (row.userId === guardianUser._id) {
      throw new Error("An owner cannot be their own guardian")
    }
    if (args.x25519PublicKey.byteLength !== 32) {
      throw new Error("x25519PublicKey must be 32 bytes")
    }

    await ctx.db.patch("guardians", row._id, {
      guardianUserId: guardianUser._id,
      x25519PublicKey: args.x25519PublicKey,
      status: "accepted",
    })
    await writeAudit(ctx, {
      userId: row.userId,
      event: "guardian.accepted",
      meta: { guardianId: row._id },
    })
    return { guardianId: row._id, subjectUserId: row.userId }
  },
})

/**
 * The owner drops a guardian. The row is kept — the audit trail needs it — but
 * the sealed shares it protected are worthless once the owner's device rotates
 * and re-seals to the replacement, which the UI must prompt for next.
 */
export const revoke = mutation({
  args: { guardianId: v.id("guardians") },
  handler: async (ctx, { guardianId }) => {
    const user = await requireUser(ctx)
    const row = await ctx.db.get("guardians", guardianId)
    if (row === null || row.userId !== user._id) {
      throw new Error("Not found")
    }
    await ctx.db.patch("guardians", guardianId, {
      status: "revoked",
      // Kill the invite in the same write, in case it was never accepted.
      inviteExpiresAt: 0,
    })
    await writeAudit(ctx, {
      userId: user._id,
      event: "guardian.revoked",
      meta: { guardianId },
    })
    return null
  },
})

/**
 * Everyone this caller is a guardian for. The guardian-side home screen.
 *
 * `x25519PublicKey` is returned deliberately. It is a **public** key — the
 * guardian's device published it at accept time and every heir bundle is
 * sealed to it — so returning it hands over no capability. What it buys is the
 * one check a guardian can otherwise never make: `apps/web`'s key page lets
 * them type their printed sheet and confirm it still reproduces the key this
 * vault is sealed to. Without it, a guardian discovers a lost or mistranscribed
 * sheet at the handover, which is the single ceremony that cannot be retried.
 */
export const guardianFor = query({
  args: {},
  handler: async (ctx) => {
    const rows = await acceptedGuardianships(ctx)
    return await Promise.all(
      rows.map(async (row) => {
        const subject = await ctx.db.get("users", row.userId)
        return {
          guardianId: row._id,
          subjectUserId: row.userId,
          subjectName: subject?.name ?? null,
          relation: row.relation,
          // `undefined` for a guardianship accepted before key publication
          // existed. The key page says so rather than rendering a failed check.
          x25519PublicKey: row.x25519PublicKey ?? null,
        }
      })
    )
  },
})

/**
 * The same list, a page at a time.
 *
 * `guardianFor` reads a fixed window and is right for what calls it — the nav
 * only needs to know whether the list is empty, the home screen wants a count,
 * and the key page needs every published public key at once to check a sheet
 * against. None of those can page.
 *
 * The *screen* can, and past a dozen rows it must: a guardian who guards twenty
 * vaults was getting a wall of names above the one thing actually asking for
 * them. This is a separate function rather than a flag on that one, because a
 * paginated return type would force every other caller to unwrap a page they
 * did not want.
 *
 * It also has no window to fall out of. `acceptedGuardianships` caps at 50, so
 * a guardian past that silently lost rows; a cursor has no cap.
 */
export const guardianForPage = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const guardianUser = await getCurrentUserOrThrow(ctx)
    const page = await ctx.db
      .query("guardians")
      .withIndex("by_guardianUserId_and_status", (q) =>
        q.eq("guardianUserId", guardianUser._id).eq("status", "accepted")
      )
      .paginate(paginationOpts)

    return {
      ...page,
      page: await Promise.all(
        page.page.map(async (row) => {
          const subject = await ctx.db.get("users", row.userId)
          return {
            guardianId: row._id,
            subjectName: subject?.name ?? null,
            relation: row.relation,
          }
        })
      ),
    }
  },
})

/**
 * Everything a guardian is being asked to do, across every vault they guard.
 *
 * ## Two duties, one list
 *
 * A guardian is asked for something twice in a claim's life, and both are dead
 * ends without them:
 *
 *  - **`confirm`** — the claim is in `guardian_review`. `claims.guardianConfirm`
 *    starts the 30-day veto window. Nothing else can move a claim out of that
 *    state, so a claim with no guardian acting sits there forever.
 *  - **`handover`** — the claim is `released`. The heir holds only
 *    `S_server_h`; `K_h = S_server_h ⊕ S_guardian_h`, so until the guardian
 *    hands over their half through `release.guardianShareForClaim`, the heir's
 *    box is unopenable. `apps/web`'s heir box already asks for that half.
 *
 * They are one query because they are one screen: a guardian opens the app
 * because they were told something needs them, not knowing which of the two it
 * is.
 *
 * ## The status is in the index now
 *
 * This used to read a fixed window of each subject's claims and filter by
 * status in memory, which meant a subject with more claims than the window
 * could hide a real duty from their guardian — no error, just an empty list.
 * Every barred re-attempt inserts a row, so that window fills in exactly the
 * adversarial case. Two indexed ranges per guarded vault instead.
 */
const GUARDIAN_DUTY: Record<string, "confirm" | "handover"> = {
  guardian_review: "confirm",
  released: "handover",
}

/**
 * One claim, from the guardian's side.
 *
 * `pendingApprovals` is list-shaped across every vault a person guards, and the
 * claim screen has been filtering it client-side. That costs two things worth
 * fixing:
 *
 *  - **The duty vanishes the instant it is discharged.** `guardianConfirm`
 *    moves the claim out of `guardian_review`, which is one of the two statuses
 *    that list queries — so a guardian who confirmed successfully would watch
 *    their row disappear and be shown "not found". The screen works around it
 *    today by holding a `confirmed` flag above the subscription.
 *  - **A finished claim becomes unreadable.** `vetoed`, `locked` and
 *    `awaiting_veto` appear in no guardian query at all, so a guardian who
 *    confirmed a death last week has no way to learn what became of it.
 *
 * This returns whatever the claim is now, with `duty: null` when nothing is
 * being asked — which is a state the screen can render honestly rather than as
 * a missing record.
 *
 * The gate is `requireAcceptedGuardian`, the same one `claims.guardianConfirm`
 * and `release.guardianShareForClaim` use. That answers the objection to adding
 * this at all: it is not a second place deciding what a guardian may see, it is
 * the same place with one more caller.
 *
 * Never returns the certificate or a URL to it — that document is third-party
 * personal data and belongs to the review queue, not to the guardian.
 */
export const claimForGuardian = query({
  args: { claimId: v.string() },
  handler: async (ctx, { claimId }) => {
    const id = ctx.db.normalizeId("claims", claimId)
    if (id === null) return null
    const claim = await ctx.db.get("claims", id)
    if (claim === null) return null
    // An unmatched claim has no vault and therefore no guardian. Returning
    // `null` keeps it indistinguishable from a claim that does not exist,
    // which is the same answer every other refusal here gives.
    const subjectUserId = claim.subjectUserId
    if (subjectUserId === undefined) return null

    // Throws for anyone who is not this vault's accepted guardian.
    await requireAcceptedGuardian(ctx, subjectUserId)

    const subject = await ctx.db.get("users", subjectUserId)
    const duty =
      claim.status === "guardian_review"
        ? ("confirm" as const)
        : claim.status === "released"
          ? ("handover" as const)
          : null

    return {
      claimId: claim._id,
      duty,
      status: claim.status,
      subjectName: subject?.name ?? null,
      claimantName: claim.claimantName,
      certificateName: claim.certificateName ?? null,
      nameMatch: claim.nameMatch ?? null,
      heirLinked: claim.heirId !== undefined,
      guardianConfirmedAt: claim.guardianConfirmedAt ?? null,
      vetoDeadline: claim.vetoDeadline ?? null,
      submittedAt: claim._creationTime,
      updatedAt: claim.updatedAt ?? claim._creationTime,
    }
  },
})

export const pendingApprovals = query({
  args: {},
  handler: async (ctx) => {
    const rows = await acceptedGuardianships(ctx)
    const pending = []
    for (const row of rows) {
      const subject = await ctx.db.get("users", row.userId)
      for (const status of ["guardian_review", "released"] as const) {
        const claims = await ctx.db
          .query("claims")
          .withIndex("by_subjectUserId_and_status", (q) =>
            q.eq("subjectUserId", row.userId).eq("status", status)
          )
          .take(20)
        for (const claim of claims) {
          pending.push({
            claimId: claim._id,
            guardianId: row._id,
            duty: GUARDIAN_DUTY[status]!,
            subjectUserId: row.userId,
            subjectName: subject?.name ?? null,
            claimantName: claim.claimantName,
            certificateName: claim.certificateName ?? null,
            nameMatch: claim.nameMatch ?? null,
            // A `guardian_review` claim with no heir linked cannot be confirmed
            // — `guardianConfirm` throws on it. Surfaced so the screen can say
            // so rather than offer a button that fails.
            heirLinked: claim.heirId !== undefined,
            submittedAt: claim._creationTime,
          })
        }
      }
    }
    return pending
  },
})

async function acceptedGuardianships(
  ctx: QueryCtx
): Promise<Doc<"guardians">[]> {
  const guardianUser = await getCurrentUserOrThrow(ctx)
  return await ctx.db
    .query("guardians")
    .withIndex("by_guardianUserId_and_status", (q) =>
      q.eq("guardianUserId", guardianUser._id).eq("status", "accepted")
    )
    .take(50)
}

/** 256 bits of invite capability. Never derived from anything guessable. */
function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES))
  let out = ""
  for (const byte of bytes) {
    out += byte.toString(16).padStart(2, "0")
  }
  return out
}

export type GuardianRow = Doc<"guardians">
export type GuardianId = Id<"guardians">
