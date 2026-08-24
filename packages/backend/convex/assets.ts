// Assets.
//
// `dekWrappedByMk`, `labelSealed`, and every blob behind `storageIds` are
// encrypted on the owner's device before they get here. `meta` is the only
// readable part and is typed to hold counts, sizes, mime types and a reminder
// date — nothing that would tell this deployment what an asset actually
// contains, or even what its owner calls it.
//
// `labelSealed` is sealed under the asset's DEK rather than MK, so it opens for
// an heir holding a released bundle. Every function below passes it through
// untouched; nothing here can name an asset, including the audit log.
//
// The subscription-lapse rule applies in exactly one place: `create`. Reads,
// updates and the entire release path never consult the plan, because a lapsed
// card must not cost anyone their inheritance.
import { v } from "convex/values"

import type { Id } from "./_generated/dataModel"
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server"
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

/**
 * The 4.1 list.
 *
 * Returns `dekWrappedByMk` alongside `labelSealed` because a row cannot render
 * without it: the label is sealed under the asset's own DEK, and the DEK is
 * wrapped under MK. Both are ciphertext this deployment cannot open, and `get`
 * already hands the same wrapper to the same authenticated owner, so nothing
 * new is exposed by having the list carry it.
 *
 * `recipientCount` drives the row's badge and 4.1's "unrouted first" sort. It
 * is tallied from three indexed scans over the owner's routing rows rather than
 * one `by_assetId` read per asset, which would be 500 queries for a full page.
 */
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

    const counts = await recipientCounts(ctx, user._id)

    return rows.map((row) => ({
      id: row._id,
      type: row.type,
      labelSealed: row.labelSealed,
      dekWrappedByMk: row.dekWrappedByMk,
      meta: row.meta,
      recipientRule: row.recipientRule,
      recipientCount: counts.get(row._id) ?? 0,
      fileCount: row.storageIds.length,
      createdAt: row._creationTime,
    }))
  },
})

/**
 * How many recipients each of this owner's assets routes to.
 *
 * Convex indexes columns, not union branches, which is why `recipientKind`
 * exists as a denormalised discriminant — sweeping the three kinds covers every
 * routing row the owner has with three scans and no branch left unread.
 *
 * The 2000-row cap is per kind. An owner past it would see an undercounted
 * badge on their least recently routed assets, never a wrong *state*: an asset
 * with any routing at all still has `recipientRule: "explicit"`, which is what
 * the "بلا مستلم" warning and the sort actually key on.
 */
async function recipientCounts(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<Map<Id<"assets">, number>> {
  const counts = new Map<Id<"assets">, number>()
  for (const kind of ["heir", "executor", "allHeirs"] as const) {
    const rows = await ctx.db
      .query("assetRecipients")
      .withIndex("by_userId_and_recipientKind", (q) =>
        q.eq("userId", userId).eq("recipientKind", kind)
      )
      .take(2000)
    for (const row of rows) {
      counts.set(row.assetId, (counts.get(row.assetId) ?? 0) + 1)
    }
  }
  return counts
}

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
      labelSealed: asset.labelSealed,
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
    labelSealed: v.bytes(),
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
      labelSealed: args.labelSealed,
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
    labelSealed: v.optional(v.bytes()),
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
