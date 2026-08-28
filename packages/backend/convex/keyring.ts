// The recovery leg, as the server sees it.
//
// `mkWrappedByRecovery` is MK under K_rec = S_paper — one share, not two. The
// guardian used to hold the other half; they no longer appear in recovery at
// all, and this deployment has never held either. See `packages/crypto/src/
// recovery.ts` for why storing the guardian half here was the worse option
// rather than the safer one.
//
// The wrapper is sealed under an AAD of `wassiya/recovery/v2 | userId |
// paperVersion`. That is why `paperVersion` is not merely bookkeeping here: it
// is an input to the ciphertext, so the two must be written together or the
// owner is left with a wrapper nothing can open.
import { v } from "convex/values"

import { mutation, query, type QueryCtx } from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"
import { writeAudit } from "./audit"
import { sendRecoveryNotice } from "./email"
import { assertIdentityVerified, requireUser } from "./model/access"

/**
 * First write and every rotation go through here. A rotation is a re-wrap, not
 * a re-key: MK is unchanged, so the vault stays readable while the old paper
 * sheet stops working the moment this returns.
 *
 * `paperVersion` is passed in rather than derived, because the *client* had to
 * know it before it could build the ciphertext — it is bound into the AAD. The
 * server's job is to refuse a version that does not follow from the stored one,
 * so a wrapper and the version it was sealed under can never drift apart.
 */
export const save = mutation({
  args: {
    mkWrappedByRecovery: v.bytes(),
    /** The version bound into this wrapper's AAD. Must follow from the stored one. */
    paperVersion: v.number(),
    /** True when the caller regenerated S_paper and will print a new sheet. */
    rotatingPaper: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const now = Date.now()
    const existing = await keyringFor(ctx, user._id)

    if (existing === null) {
      // "Identity verification is mandatory and blocking for owners at
      // onboarding" — enforced here, because creating the keyring is the first
      // act that brings a vault into existence. Rotation is not gated; see
      // `assertIdentityVerified`.
      assertIdentityVerified(user)
    }

    // The one check that keeps ciphertext and AAD in step. A mismatch means the
    // client wrapped under a version this row will not carry, which would be
    // indistinguishable from a wrong sheet at recovery time — so it is refused
    // now, loudly, rather than discovered by someone who has lost their phone.
    const expected =
      existing === null
        ? 1
        : args.rotatingPaper
          ? existing.paperVersion + 1
          : existing.paperVersion
    if (args.paperVersion !== expected) {
      throw new Error("Paper version does not follow from the stored keyring")
    }

    const fields = {
      userId: user._id,
      mkWrappedByRecovery: args.mkWrappedByRecovery,
      paperVersion: args.paperVersion,
      // A new sheet has not been printed or used yet; clearing both is what
      // makes "printed?" and "already used?" honest after a rotation.
      paperPrintedAt: args.rotatingPaper ? undefined : existing?.paperPrintedAt,
      paperUsedAt: args.rotatingPaper ? undefined : existing?.paperUsedAt,
      rotatedAt: now,
    }

    if (existing === null) {
      await ctx.db.insert("keyring", fields)
    } else {
      await ctx.db.replace("keyring", existing._id, fields)
    }

    await writeAudit(ctx, {
      userId: user._id,
      event: existing === null ? "keyring.created" : "keyring.rotated",
      meta: { paperVersion: args.paperVersion, rotatedPaper: args.rotatingPaper },
    })
    return { paperVersion: args.paperVersion }
  },
})

/**
 * Owner-only. Returns the ciphertext the owner's device needs to rebuild MK,
 * plus the sheet's bookkeeping. Nothing readable by this deployment is in here.
 *
 * `paperVersion` is not optional for the caller: recovery cannot recompute the
 * AAD without it.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const keyring = await keyringFor(ctx, user._id)
    if (keyring === null) {
      return null
    }
    return {
      mkWrappedByRecovery: keyring.mkWrappedByRecovery,
      paperVersion: keyring.paperVersion,
      paperPrintedAt: keyring.paperPrintedAt ?? null,
      paperUsedAt: keyring.paperUsedAt ?? null,
      rotatedAt: keyring.rotatedAt,
    }
  },
})

/** The owner confirms the sheet came out of the printer. */
export const markPaperPrinted = mutation({
  args: {},
  handler: async (ctx) => {
    const keyring = await requireKeyring(ctx)
    await ctx.db.patch("keyring", keyring.row._id, {
      paperPrintedAt: Date.now(),
    })
    await writeAudit(ctx, {
      userId: keyring.userId,
      event: "keyring.paper_printed",
      meta: { paperVersion: keyring.row.paperVersion },
    })
    return null
  },
})

/**
 * Recorded the moment a sheet opens a vault. It does not invalidate the sheet
 * — only `save({ rotatingPaper: true })` does — and that separation is
 * deliberate rather than a gap.
 *
 * The sheet is now the *only* factor guarding a vault, so a used one is a
 * bearer token that has been out in the world: it must be reprinted, and
 * `paperUsedAt` is what the app reads to insist on it. But invalidating here
 * would be a total-loss bug rather than a mitigation — the wrapper would stand
 * under a code printed on no piece of paper, with no guardian left to fall back
 * on. So this marks, the owner is shown the new code, and only their
 * acknowledgement rotates. Mint → display → confirm → save.
 */
export const markPaperUsed = mutation({
  args: {},
  handler: async (ctx) => {
    const keyring = await requireKeyring(ctx)
    await ctx.db.patch("keyring", keyring.row._id, { paperUsedAt: Date.now() })
    await writeAudit(ctx, {
      userId: keyring.userId,
      event: "keyring.paper_used",
      meta: { paperVersion: keyring.row.paperVersion },
    })

    // The loud half. Both, in this transaction: an in-app row for the owner who
    // opens the app, and mail for the owner who does not — because the person
    // who most needs to see this is the one whose sheet was taken, and they may
    // have no idea the app has anything to say.
    //
    // `recovery.attempted` is the kind the notifications screen already renders
    // in its attention band; until now nothing ever wrote it.
    await ctx.db.insert("notifications", {
      userId: keyring.userId,
      kind: "recovery.attempted",
      payload: { paperVersion: keyring.row.paperVersion },
    })
    await sendRecoveryNotice(ctx, keyring.userId)
    return null
  },
})

async function keyringFor(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<Doc<"keyring"> | null> {
  return await ctx.db
    .query("keyring")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique()
}

async function requireKeyring(ctx: QueryCtx) {
  const user = await requireUser(ctx)
  const row = await keyringFor(ctx, user._id)
  if (row === null) {
    throw new Error("Not found")
  }
  return { row, userId: user._id }
}
