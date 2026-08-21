// The recovery leg of the 2-of-3, as the server sees it.
//
// Every value written here is ciphertext produced by `@workspace/crypto` on the
// owner's device: `mkWrappedByRecovery` is MK under K_rec = S_paper ⊕
// S_guardian, and `guardianShareSealed` is S_guardian sealed to the guardian's
// X25519 public key. This deployment can decrypt neither, and no function in
// this file returns anything it could.
import { v } from "convex/values"

import { mutation, query, type QueryCtx } from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"
import { writeAudit } from "./audit"
import { assertIdentityVerified, requireUser } from "./model/access"

/**
 * First write and every rotation go through here. A rotation is a re-wrap, not
 * a re-key: MK is unchanged, so the vault stays readable while the old paper
 * sheet or the old guardian's copy stops working the moment this returns.
 */
export const save = mutation({
  args: {
    mkWrappedByRecovery: v.bytes(),
    guardianId: v.optional(v.id("guardians")),
    guardianShareSealed: v.optional(v.bytes()),
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

    if (args.guardianId !== undefined) {
      const guardian = await ctx.db.get("guardians", args.guardianId)
      if (guardian === null || guardian.userId !== user._id) {
        throw new Error("Not found")
      }
    }

    const paperVersion =
      existing === null
        ? 1
        : args.rotatingPaper
          ? existing.paperVersion + 1
          : existing.paperVersion

    const fields = {
      userId: user._id,
      mkWrappedByRecovery: args.mkWrappedByRecovery,
      paperVersion,
      // A new sheet has not been printed or used yet; clearing both is what
      // makes "printed?" and "already used?" honest after a rotation.
      paperPrintedAt: args.rotatingPaper ? undefined : existing?.paperPrintedAt,
      paperUsedAt: args.rotatingPaper ? undefined : existing?.paperUsedAt,
      guardianId: args.guardianId ?? existing?.guardianId,
      guardianShareSealed:
        args.guardianShareSealed ?? existing?.guardianShareSealed,
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
      meta: {
        paperVersion,
        rotatedPaper: args.rotatingPaper,
        rotatedGuardianShare: args.guardianShareSealed !== undefined,
      },
    })
    return { paperVersion }
  },
})

/**
 * Owner-only. Returns the ciphertext the owner's device needs to rebuild MK,
 * plus the sheet's bookkeeping. Nothing readable by this deployment is in here.
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
      guardianId: keyring.guardianId ?? null,
      hasGuardianShare: keyring.guardianShareSealed !== undefined,
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
 * Recorded after a sheet is used in a recovery. It does not invalidate the
 * sheet — only `save({ rotatingPaper: true })` does — but a used sheet should
 * be reprinted, and the settings screen nags on this field.
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
