// The end of a released vault. One year after release, when the owner's last
// delivery closes, everything the vault held is deleted (`model/vault.ts` says
// what that covers). After it nobody, Wassiya included, can open any of it.
//
// Batched and self-scheduling, like the other sweeps: a vault can hold hundreds
// of assets with dozens of blobs each, more than one mutation may delete.
import { v } from "convex/values"

import { internal } from "./_generated/api"
import { internalMutation } from "./_generated/server"
import { writeAudit } from "./audit"
import { deleteVaultBatch } from "./model/vault"

export const purge = internalMutation({
  args: { ownerId: v.id("users") },
  handler: async (ctx, { ownerId }) => {
    if (!(await deleteVaultBatch(ctx, ownerId))) {
      await ctx.scheduler.runAfter(0, internal.vault.purge, { ownerId })
      return { done: false }
    }
    await writeAudit(ctx, {
      userId: ownerId,
      event: "vault.deleted",
      meta: {},
    })
    return { done: true }
  },
})
