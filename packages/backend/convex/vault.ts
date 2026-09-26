// The end of a released vault. One year after release, when the owner's last
// delivery closes, everything the vault held is deleted — every asset with its
// files and handover wrapper, every executor with their contact details, ID
// hash and sheet wrapper, and the recovery wrapper with the release key. After
// it nobody, Wassiya included, can open any of it.
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

    // The executors go too: their personal details have no purpose once the
    // handover is over. Deliveries keep their ids and read a missing executor
    // as no contact.
    const executors = await ctx.db
      .query("executors")
      .withIndex("by_userId", (q) => q.eq("userId", ownerId))
      .take(20)
    for (const executor of executors) {
      await ctx.db.delete("executors", executor._id)
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
