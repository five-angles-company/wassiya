// The end of a released vault. One year after release, when the owner's last
// delivery closes, everything the vault held is deleted — every asset with its
// files and escrowed key, every routing row, every personal message, and the
// recovery wrapper. After it nobody, Wassiya included, can open any of it.
//
// Batched and self-scheduling, like the other sweeps: a vault can hold hundreds
// of assets with dozens of blobs each, more than one mutation may delete.
import { v } from "convex/values"

import { internal } from "./_generated/api"
import { internalMutation } from "./_generated/server"
import { writeAudit } from "./audit"

const ASSET_BATCH = 25

export const purge = internalMutation({
  args: { ownerId: v.id("users") },
  handler: async (ctx, { ownerId }) => {
    const assets = await ctx.db
      .query("assets")
      .withIndex("by_userId", (q) => q.eq("userId", ownerId))
      .take(ASSET_BATCH)

    for (const asset of assets) {
      const routes = await ctx.db
        .query("assetRecipients")
        .withIndex("by_assetId", (q) => q.eq("assetId", asset._id))
        .take(200)
      for (const route of routes) {
        await ctx.db.delete("assetRecipients", route._id)
      }
      for (const file of asset.files) {
        await ctx.storage.delete(file.storageId)
        if (file.thumbnailId !== undefined) {
          await ctx.storage.delete(file.thumbnailId)
        }
      }
      await ctx.db.delete("assets", asset._id)
    }

    if (assets.length === ASSET_BATCH) {
      await ctx.scheduler.runAfter(0, internal.vault.purge, { ownerId })
      return { done: false }
    }

    const heirs = await ctx.db
      .query("heirs")
      .withIndex("by_userId", (q) => q.eq("userId", ownerId))
      .take(100)
    for (const heir of heirs) {
      if (heir.messageMeta === undefined) continue
      await ctx.storage.delete(heir.messageMeta.storageId)
      await ctx.db.patch("heirs", heir._id, { messageMeta: undefined })
    }

    const keyring = await ctx.db
      .query("keyring")
      .withIndex("by_userId", (q) => q.eq("userId", ownerId))
      .unique()
    if (keyring !== null) await ctx.db.delete("keyring", keyring._id)

    await writeAudit(ctx, {
      userId: ownerId,
      event: "vault.deleted",
      meta: {},
    })
    return { done: true }
  },
})
