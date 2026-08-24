// The guardian: the second holder in the 2-of-3, and the human check on a
// death claim.
//
// A guardian never holds MK. They hold one XOR share — of K_rec for recovery,
// and of K_h for each heir — sealed to their own X25519 key, which only their
// device can open. This deployment stores the sealed blobs and hands them back
// to that one guardian; it can read none of them.
import { v } from "convex/values"

import type { Doc, Id } from "./_generated/dataModel"
import { mutation, query, type QueryCtx } from "./_generated/server"
import { writeAudit } from "./audit"
import { requireUser } from "./model/access"
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
       * device needs in order to seal S_guardian to them.
       *
       * Safe to return: a public key is the half meant to be published, and
       * this deployment already stores it in the clear. What it cannot do is
       * open anything — the secret half never leaves the guardian's device, so
       * a server holding this key still cannot reconstruct K_rec.
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

/** Everyone this caller is a guardian for. The guardian-side home screen. */
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
        }
      })
    )
  },
})

/**
 * What is waiting on this guardian: claims in `guardian_review` for anyone they
 * guard. Read-only — confirming is `claims.guardianConfirm`.
 */
export const pendingApprovals = query({
  args: {},
  handler: async (ctx) => {
    const rows = await acceptedGuardianships(ctx)
    const pending = []
    for (const row of rows) {
      const claims = await ctx.db
        .query("claims")
        .withIndex("by_subjectUserId", (q) => q.eq("subjectUserId", row.userId))
        .take(20)
      for (const claim of claims) {
        if (claim.status !== "guardian_review") {
          continue
        }
        const subject = await ctx.db.get("users", row.userId)
        pending.push({
          claimId: claim._id,
          subjectUserId: row.userId,
          subjectName: subject?.name ?? null,
          claimantName: claim.claimantName,
          certificateName: claim.certificateName ?? null,
          nameMatch: claim.nameMatch ?? null,
          submittedAt: claim._creationTime,
        })
      }
    }
    return pending
  },
})

/**
 * The guardian's half of the recovery ceremony.
 *
 * Returns the sealed share **to its own guardian and to nobody else**. They
 * decrypt it locally with `openFromGuardian` and hand the plaintext to the
 * owner's new device out of band — the plaintext never traverses this
 * deployment, which is the whole point of sealing it in the first place.
 */
export const approveRecovery = mutation({
  args: { guardianId: v.id("guardians") },
  handler: async (ctx, { guardianId }) => {
    const guardianUser = await getCurrentUserOrThrow(ctx)
    const row = await ctx.db.get("guardians", guardianId)
    if (
      row === null ||
      row.status !== "accepted" ||
      row.guardianUserId !== guardianUser._id
    ) {
      throw new Error("Not authorised")
    }

    const keyring = await ctx.db
      .query("keyring")
      .withIndex("by_userId", (q) => q.eq("userId", row.userId))
      .unique()
    if (keyring?.guardianShareSealed === undefined) {
      throw new Error("Not found")
    }

    await writeAudit(ctx, {
      userId: row.userId,
      event: "guardian.recovery_approved",
      meta: { guardianId },
    })
    return { guardianShareSealed: keyring.guardianShareSealed }
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
