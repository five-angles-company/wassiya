// What deleting a vault covers: every asset with its files and handover
// wrapper, every executor with their contact details, ID hash and sheet
// wrapper, and the recovery wrapper with the release key. Shared by the end of
// a released vault (`vault.purge`) and account deletion (`account.purge`), so
// the two can never disagree about what "deleted" means.
import type { Id } from "../_generated/dataModel"
import type { MutationCtx } from "../_generated/server"

const ASSET_BATCH = 25
const EXECUTOR_BATCH = 50

/**
 * Delete one batch of the vault. Resolves true once nothing of it is left;
 * false means the caller must run it again in a fresh transaction, because a
 * vault can hold more blobs than one mutation may delete.
 */
export async function deleteVaultBatch(
  ctx: MutationCtx,
  ownerId: Id<"users">
): Promise<boolean> {
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
  if (assets.length === ASSET_BATCH) return false

  // Deliveries keep their ids and read a missing executor as no contact.
  const executors = await ctx.db
    .query("executors")
    .withIndex("by_userId", (q) => q.eq("userId", ownerId))
    .take(EXECUTOR_BATCH)
  for (const executor of executors) {
    await ctx.db.delete("executors", executor._id)
  }
  if (executors.length === EXECUTOR_BATCH) return false

  const keyring = await ctx.db
    .query("keyring")
    .withIndex("by_userId", (q) => q.eq("userId", ownerId))
    .unique()
  if (keyring !== null) await ctx.db.delete("keyring", keyring._id)
  return true
}
