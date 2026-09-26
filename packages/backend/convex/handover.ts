// The release gate — AGENTS.md "Executors".
//
//  - `open` is the only function that hands a handover wrapper to anyone but
//    its owner: `dekWrappedByRelease`, an executor's `sheet`, and the owner's
//    `releaseKeyWrappedByMk` with the recovery wrapper for the fallback. None of
//    them opens without the executor's sheet or the owner's recovery sheet,
//    which Wassiya never holds — but the gate still decides who may try.
//    `scripts/verify-invariants.mjs` enforces it.
//  - Every precondition is re-read here, as the calling executor. Nothing passed
//    in is trusted, and every refusal is the same "not found".
//  - An open that passes the gate is audited in the same transaction.
//  - Only handed-over assets are served. A private asset never leaves.
import { v } from "convex/values"

import type { Doc, Id } from "./_generated/dataModel"
import { mutation, type MutationCtx } from "./_generated/server"
import { writeAudit } from "./audit"
import { getCurrentUserOrThrow } from "./users"

export const open = mutation({
  args: { deliveryId: v.id("deliveries") },
  handler: async (ctx, { deliveryId }) => {
    const delivery = await openableDelivery(ctx, deliveryId)
    if (delivery === null) throw new Error("Not found")

    const now = Date.now()
    await ctx.db.patch("deliveries", deliveryId, { lastOpenedAt: now })
    await writeAudit(ctx, {
      userId: delivery.subjectUserId,
      event: "release.delivery_opened",
      meta: {
        deliveryId,
        executorId: delivery.executorId,
        executorUserId: delivery.executorUserId ?? null,
      },
      at: now,
    })

    const ownerId = delivery.subjectUserId
    const executor = await ctx.db.get("executors", delivery.executorId)
    const keyring = await ctx.db
      .query("keyring")
      .withIndex("by_userId", (q) => q.eq("userId", ownerId))
      .unique()
    const assets = await ctx.db
      .query("assets")
      .withIndex("by_userId", (q) => q.eq("userId", ownerId))
      .take(500)

    const items = []
    for (const asset of assets) {
      if (asset.dekWrappedByRelease === undefined) continue
      items.push({
        assetId: asset._id,
        type: asset.type,
        meta: asset.meta,
        labelSealed: asset.labelSealed,
        secretSealed: asset.secretSealed ?? null,
        dekWrappedByRelease: asset.dekWrappedByRelease,
        files: await Promise.all(
          asset.files.map(async (file) => ({
            url: await ctx.storage.getUrl(file.storageId),
            thumbnailUrl:
              file.thumbnailId === undefined
                ? null
                : await ctx.storage.getUrl(file.thumbnailId),
          }))
        ),
      })
    }

    return {
      ownerId,
      executorId: delivery.executorId,
      expiresAt: delivery.expiresAt,
      sheet:
        executor?.sheet === undefined
          ? null
          : {
              releaseKeyWrapped: executor.sheet.releaseKeyWrapped,
              version: executor.sheet.version,
            },
      // The owner's recovery sheet, when the executor's own is lost: it opens
      // MK, and MK opens the release key. Only handed-over items are served
      // above, so this reaches nothing the owner kept private.
      fallback:
        keyring === null || keyring.releaseKeyWrappedByMk === undefined
          ? null
          : {
              mkWrappedByRecovery: keyring.mkWrappedByRecovery,
              paperVersion: keyring.paperVersion,
              releaseKeyWrappedByMk: keyring.releaseKeyWrappedByMk,
            },
      items,
    }
  },
})

/**
 * Every precondition for opening a delivery, re-read now. `null` means "not
 * found" to the caller, who learns nothing more.
 */
async function openableDelivery(
  ctx: MutationCtx,
  deliveryId: Id<"deliveries">
): Promise<Doc<"deliveries"> | null> {
  const caller = await getCurrentUserOrThrow(ctx)
  const delivery = await ctx.db.get("deliveries", deliveryId)
  if (delivery === null) return null
  if (delivery.status !== "ready") return null
  if (delivery.destroyedAt !== undefined) return null
  if (delivery.expiresAt <= Date.now()) return null
  if (delivery.executorUserId !== caller._id) return null
  if (caller.identityStatus !== "verified") return null

  const claim = await ctx.db.get("claims", delivery.claimId)
  if (claim === null || claim.status !== "released") return null
  if (claim.nameMatch !== true) return null
  if (claim.subjectUserId !== delivery.subjectUserId) return null
  return delivery
}
