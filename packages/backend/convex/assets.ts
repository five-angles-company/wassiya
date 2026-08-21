// Assets.
//
// `dekWrappedByMk` and every blob behind `storageIds` are encrypted on the
// owner's device before they get here. `meta` is the only readable part and is
// typed to hold counts, sizes, mime types and a reminder date — nothing that
// would tell this deployment what an asset actually contains.
//
// The subscription-lapse rule applies in exactly one place: `create`. Reads,
// updates and the entire release path never consult the plan, because a lapsed
// card must not cost anyone their inheritance.
import { v } from "convex/values"

import type { Id } from "./_generated/dataModel"
import { mutation, query, type MutationCtx } from "./_generated/server"
import { writeAudit } from "./audit"
import { assertCanAddAssets, requireUser } from "./model/access"

const assetType = v.union(
  v.literal("crypto"),
  v.literal("bank"),
  v.literal("document"),
  v.literal("photos"),
  v.literal("digital"),
  v.literal("note")
)

const assetMeta = v.object({
  itemCount: v.optional(v.number()),
  byteSize: v.optional(v.number()),
  mimeType: v.optional(v.string()),
  expiryRemindAt: v.optional(v.number()),
})

/** Upload target for already-encrypted bytes. The plaintext never leaves the device. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const list = query({
  args: { type: v.optional(assetType) },
  handler: async (ctx, { type }) => {
    const user = await requireUser(ctx)
    const rows =
      type === undefined
        ? await ctx.db
            .query("assets")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .take(500)
        : await ctx.db
            .query("assets")
            .withIndex("by_userId_and_type", (q) =>
              q.eq("userId", user._id).eq("type", type)
            )
            .take(500)
    return rows.map((row) => ({
      id: row._id,
      type: row.type,
      title: row.title,
      meta: row.meta,
      recipientRule: row.recipientRule,
      fileCount: row.storageIds.length,
      createdAt: row._creationTime,
    }))
  },
})

/** The owner's device asks for this when it is about to decrypt an asset. */
export const get = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    const user = await requireUser(ctx)
    const asset = await ctx.db.get("assets", assetId)
    if (asset === null || asset.userId !== user._id) {
      throw new Error("Not found")
    }
    const urls = await Promise.all(
      asset.storageIds.map((id) => ctx.storage.getUrl(id))
    )
    return {
      id: asset._id,
      type: asset.type,
      title: asset.title,
      meta: asset.meta,
      recipientRule: asset.recipientRule,
      dekWrappedByMk: asset.dekWrappedByMk,
      storageIds: asset.storageIds,
      urls,
    }
  },
})

export const create = mutation({
  args: {
    type: assetType,
    title: v.string(),
    meta: assetMeta,
    dekWrappedByMk: v.bytes(),
    storageIds: v.array(v.id("_storage")),
    recipientRule: v.union(v.literal("default"), v.literal("explicit")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    // The one gate the subscription state is allowed to close.
    assertCanAddAssets(user, Date.now())

    const assetId = await ctx.db.insert("assets", {
      userId: user._id,
      type: args.type,
      title: args.title,
      meta: args.meta,
      dekWrappedByMk: args.dekWrappedByMk,
      storageIds: args.storageIds,
      recipientRule: args.recipientRule,
    })
    await bumpStorageUsed(ctx, user._id, args.meta.byteSize ?? 0)
    await writeAudit(ctx, {
      userId: user._id,
      event: "asset.created",
      meta: { assetId, type: args.type, fileCount: args.storageIds.length },
    })
    return assetId
  },
})

/**
 * Renaming, re-tagging, and re-wrapping after an MK rotation. Deliberately not
 * gated on the subscription: an existing vault stays fully editable.
 */
export const update = mutation({
  args: {
    assetId: v.id("assets"),
    title: v.optional(v.string()),
    meta: v.optional(assetMeta),
    dekWrappedByMk: v.optional(v.bytes()),
  },
  handler: async (ctx, { assetId, ...fields }) => {
    const user = await requireUser(ctx)
    const asset = await ctx.db.get("assets", assetId)
    if (asset === null || asset.userId !== user._id) {
      throw new Error("Not found")
    }
    await ctx.db.patch("assets", assetId, fields)
    await writeAudit(ctx, {
      userId: user._id,
      event: "asset.updated",
      meta: { assetId, fields: Object.keys(fields).join(",") },
    })
    return null
  },
})

export const remove = mutation({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    const user = await requireUser(ctx)
    const asset = await ctx.db.get("assets", assetId)
    if (asset === null || asset.userId !== user._id) {
      throw new Error("Not found")
    }

    const routes = await ctx.db
      .query("assetRecipients")
      .withIndex("by_assetId", (q) => q.eq("assetId", assetId))
      .take(200)
    for (const route of routes) {
      await ctx.db.delete("assetRecipients", route._id)
    }
    for (const storageId of asset.storageIds) {
      await ctx.storage.delete(storageId)
    }
    await ctx.db.delete("assets", assetId)
    await bumpStorageUsed(ctx, user._id, -(asset.meta.byteSize ?? 0))

    await writeAudit(ctx, {
      userId: user._id,
      event: "asset.removed",
      meta: { assetId, routesRemoved: routes.length },
    })
    return null
  },
})

/**
 * Storage accounting for the settings screen. A denormalised counter, because
 * Convex has no count operator and summing every asset would not scale.
 */
async function bumpStorageUsed(
  ctx: MutationCtx,
  userId: Id<"users">,
  delta: number
): Promise<void> {
  if (delta === 0) {
    return
  }
  const user = await ctx.db.get("users", userId)
  if (user === null) {
    return
  }
  const subscription = user.subscription ?? { plan: "free" }
  await ctx.db.patch("users", userId, {
    subscription: {
      ...subscription,
      storageBytesUsed: Math.max(
        0,
        (subscription.storageBytesUsed ?? 0) + delta
      ),
    },
  })
}
