// Heirs.
//
// "Routing, not shares" — an heir is a recipient, never a fraction. There is no
// share arithmetic anywhere in this deployment, by design: الأنصبة يحدّدها
// القانون، لا التطبيق.
//
// A "silent" heir learns nothing until release. A "notified" heir knows they
// are named and still sees no content. Neither distinction lives in the crypto:
// both get the same sealed bundle, and mode only governs notifications.
import { v } from "convex/values"

import type { Id } from "./_generated/dataModel"
import { mutation, query, type QueryCtx } from "./_generated/server"
import { writeAudit } from "./audit"
import { requireUser } from "./model/access"

const modeValidator = v.union(v.literal("silent"), v.literal("notified"))

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const rows = await ctx.db
      .query("heirs")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100)

    // 5.1 puts "تستلم ٤ أصول" on every row, and an heir who receives nothing is
    // that screen's amber case — the mirror of "بلا مستلم" in 4.1. Both need a
    // count, so it is computed once here rather than per heir on the client.
    const { direct, sharedCount } = await routedCounts(ctx, user._id)

    return rows.map((row) => ({
      id: row._id,
      name: row.name,
      relation: row.relation,
      phone: row.phone,
      mode: row.mode,
      inviteStatus: row.inviteStatus,
      messageKind: row.messageMeta?.kind ?? null,
      /**
       * Assets routed to this heir: the ones naming them, plus every asset
       * routed to "all heirs jointly", which they receive as well. An heir
       * added after a shared route still receives it — that is the point of
       * folding the bucket in here rather than expanding it at write time.
       */
      routedAssetCount: (direct.get(row._id) ?? 0) + sharedCount,
    }))
  },
})

/**
 * How many assets each heir is named on, and how many go to all heirs jointly.
 *
 * Two indexed scans over the owner's routing rows rather than one read per
 * heir. The 2000 cap is per scan; past it a count under-reports, which shows as
 * a smaller number on a card — never as a wrong *state*, since "receives
 * nothing" is decided by the total being zero and an under-count cannot
 * manufacture a zero out of a non-empty set.
 */
async function routedCounts(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<{ direct: Map<Id<"heirs">, number>; sharedCount: number }> {
  const direct = new Map<Id<"heirs">, number>()
  const named = await ctx.db
    .query("assetRecipients")
    .withIndex("by_userId_and_recipientKind", (q) =>
      q.eq("userId", userId).eq("recipientKind", "heir")
    )
    .take(2000)
  for (const row of named) {
    if (row.recipientHeirId === undefined) continue
    direct.set(row.recipientHeirId, (direct.get(row.recipientHeirId) ?? 0) + 1)
  }

  const shared = await ctx.db
    .query("assetRecipients")
    .withIndex("by_userId_and_recipientKind", (q) =>
      q.eq("userId", userId).eq("recipientKind", "allHeirs")
    )
    .take(2000)

  return { direct, sharedCount: shared.length }
}

export const add = mutation({
  args: {
    name: v.string(),
    relation: v.string(),
    phone: v.string(),
    mode: modeValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const heirId = await ctx.db.insert("heirs", {
      userId: user._id,
      name: args.name,
      relation: args.relation,
      phone: args.phone,
      mode: args.mode,
      inviteStatus: "none",
    })
    await writeAudit(ctx, {
      userId: user._id,
      event: "heir.added",
      meta: { heirId, mode: args.mode },
    })
    return heirId
  },
})

export const update = mutation({
  args: {
    heirId: v.id("heirs"),
    name: v.optional(v.string()),
    relation: v.optional(v.string()),
    phone: v.optional(v.string()),
    mode: v.optional(modeValidator),
  },
  handler: async (ctx, { heirId, ...fields }) => {
    const user = await requireUser(ctx)
    const heir = await ctx.db.get("heirs", heirId)
    if (heir === null || heir.userId !== user._id) {
      throw new Error("Not found")
    }
    await ctx.db.patch("heirs", heirId, fields)
    await writeAudit(ctx, {
      userId: user._id,
      event: "heir.updated",
      meta: { heirId, fields: Object.keys(fields).join(",") },
    })
    return null
  },
})

/**
 * Attach the heir's personal message. Only its kind and storage id land here —
 * the content is encrypted on-device under a message key that travels in the
 * release bundle, so this deployment holds an unreadable blob.
 */
export const setMessage = mutation({
  args: {
    heirId: v.id("heirs"),
    kind: v.union(v.literal("text"), v.literal("audio"), v.literal("video")),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { heirId, kind, storageId }) => {
    const user = await requireUser(ctx)
    const heir = await ctx.db.get("heirs", heirId)
    if (heir === null || heir.userId !== user._id) {
      throw new Error("Not found")
    }
    if (heir.messageMeta !== undefined) {
      await ctx.storage.delete(heir.messageMeta.storageId)
    }
    await ctx.db.patch("heirs", heirId, { messageMeta: { kind, storageId } })
    await writeAudit(ctx, {
      userId: user._id,
      event: "heir.message_set",
      meta: { heirId, kind },
    })
    return null
  },
})

/**
 * Removing an heir also removes their routing rows and their release bundle —
 * a bundle for a deleted heir is a share of K_h nobody should still be able to
 * claim against.
 */
export const remove = mutation({
  args: { heirId: v.id("heirs") },
  handler: async (ctx, { heirId }) => {
    const user = await requireUser(ctx)
    const heir = await ctx.db.get("heirs", heirId)
    if (heir === null || heir.userId !== user._id) {
      throw new Error("Not found")
    }

    const routes = await ctx.db
      .query("assetRecipients")
      .withIndex("by_userId_and_recipientHeirId", (q) =>
        q.eq("userId", user._id).eq("recipientHeirId", heirId)
      )
      .take(500)
    for (const route of routes) {
      await ctx.db.delete("assetRecipients", route._id)
    }

    const bundles = await ctx.db
      .query("releaseBundles")
      .withIndex("by_userId_and_heirId", (q) =>
        q.eq("userId", user._id).eq("heirId", heirId)
      )
      .take(20)
    for (const bundle of bundles) {
      await ctx.storage.delete(bundle.bundleStorageId)
      await ctx.db.delete("releaseBundles", bundle._id)
    }

    if (heir.messageMeta !== undefined) {
      await ctx.storage.delete(heir.messageMeta.storageId)
    }
    await ctx.db.delete("heirs", heirId)

    await writeAudit(ctx, {
      userId: user._id,
      event: "heir.removed",
      meta: { heirId, routesRemoved: routes.length },
    })
    return null
  },
})
