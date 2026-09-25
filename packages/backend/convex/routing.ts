// Routing: which recipient gets which asset, whole.
//
// No share arithmetic exists here or anywhere else in this deployment. An asset
// goes to an heir, to the executor, or to all heirs — never to "one third of".
//
// Every write is `setRecipients`, which replaces an asset's routing atomically
// and keeps the escrow invariant in the same transaction: a routed asset
// carries its DEK sealed to the escrow key, an unrouted one carries nothing.
// Moving an asset between recipients changes no key.
import { v } from "convex/values"

import type { Doc, Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import { writeAudit } from "./audit"
import { requireUser } from "./model/access"
import { assertEscrowSeal } from "./model/escrowSeal"
import { routesForHeir } from "./model/receivers"

const recipientValidator = v.union(
  v.object({ kind: v.literal("heir"), heirId: v.id("heirs") }),
  v.object({ kind: v.literal("executor") }),
  v.object({ kind: v.literal("allHeirs") })
)

type Recipient = Doc<"assetRecipients">["recipient"]

/** The routing of one asset. */
export const forAsset = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    const user = await requireUser(ctx)
    const asset = await ctx.db.get("assets", assetId)
    if (asset === null || asset.userId !== user._id) {
      throw new Error("Not found")
    }
    const rows = await ctx.db
      .query("assetRecipients")
      .withIndex("by_assetId", (q) => q.eq("assetId", assetId))
      .take(200)
    return rows.map((row) => ({ id: row._id, recipient: row.recipient }))
  },
})

/**
 * Replace an asset's routing wholesale.
 *
 * Routing to anyone requires `escrowedDek`: the owner's device seals the DEK to
 * the pinned escrow key as part of the same save. Routing to nobody deletes the
 * sealed copy, because only routed items are ever escrowed.
 */
export const setRecipients = mutation({
  args: {
    assetId: v.id("assets"),
    recipients: v.array(v.object({ recipient: recipientValidator })),
    escrowedDek: v.optional(v.bytes()),
    escrowKeyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const asset = await ctx.db.get("assets", args.assetId)
    if (asset === null || asset.userId !== user._id) {
      throw new Error("Not found")
    }

    const routed = args.recipients.length > 0
    if (routed) {
      if (args.escrowedDek === undefined || args.escrowKeyId === undefined) {
        throw new Error("A routed asset needs its escrowed key")
      }
      assertEscrowSeal(args.escrowedDek, args.escrowKeyId)
    }

    // Every named heir must be one of this owner's. Checked before any write,
    // so a bad id cannot leave the routing half-replaced.
    for (const entry of args.recipients) {
      if (entry.recipient.kind === "heir") {
        const heir = await ctx.db.get("heirs", entry.recipient.heirId)
        if (heir === null || heir.userId !== user._id) {
          throw new Error("Not found")
        }
      }
    }

    const existing = await ctx.db
      .query("assetRecipients")
      .withIndex("by_assetId", (q) => q.eq("assetId", args.assetId))
      .take(200)
    for (const row of existing) {
      await ctx.db.delete("assetRecipients", row._id)
    }

    for (const entry of args.recipients) {
      await ctx.db.insert("assetRecipients", {
        assetId: args.assetId,
        userId: user._id,
        recipient: entry.recipient,
        recipientKind: entry.recipient.kind,
        recipientHeirId: heirIdOf(entry.recipient),
      })
    }

    await ctx.db.patch("assets", args.assetId, {
      recipientRule: routed ? "explicit" : "default",
      escrowedDek: routed ? args.escrowedDek : undefined,
      escrowKeyId: routed ? args.escrowKeyId : undefined,
    })
    await writeAudit(ctx, {
      userId: user._id,
      event: "routing.changed",
      meta: { assetId: args.assetId, recipientCount: args.recipients.length },
    })
    return null
  },
})

/**
 * Exactly what one heir would receive — the heir-preview screen. Wrapped DEKs
 * only, which the owner's device opens with MK to name each asset.
 */
export const previewForHeir = query({
  args: { heirId: v.id("heirs") },
  handler: async (ctx, { heirId }) => {
    const user = await requireUser(ctx)
    const heir = await ctx.db.get("heirs", heirId)
    if (heir === null || heir.userId !== user._id) {
      throw new Error("Not found")
    }

    const items = []
    for (const row of await routesForHeir(ctx, user._id, heirId)) {
      const asset = await ctx.db.get("assets", row.assetId)
      if (asset === null) {
        continue
      }
      items.push({
        assetId: asset._id,
        type: asset.type,
        labelSealed: asset.labelSealed,
        meta: asset.meta,
        via: row.recipient.kind,
        dekWrappedByMk: asset.dekWrappedByMk,
      })
    }

    return {
      heir: { id: heir._id, name: heir.name, mode: heir.mode },
      messageKind: heir.messageMeta?.kind ?? null,
      items,
    }
  },
})

function heirIdOf(recipient: Recipient): Id<"heirs"> | undefined {
  return recipient.kind === "heir" ? recipient.heirId : undefined
}

/**
 * Every asset with the recipients it routes to — the ٥.٣ overview.
 *
 * 5.3 groups by category for readability while *"the stored edge is per
 * asset"*, so this returns the per-asset edges and leaves the grouping to the
 * screen. No counts, no ratios: a list of recipients, because that is what the
 * data model is. There are no percentages anywhere in this product.
 *
 * Built from two indexed scans plus one asset read pass, rather than a
 * `by_assetId` query per asset, which would be one round trip per row of a
 * 500-asset vault.
 */
export const overview = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)

    const assets = await ctx.db
      .query("assets")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(500)

    const byAsset = new Map<Id<"assets">, Recipient[]>()
    for (const kind of ["heir", "executor", "allHeirs"] as const) {
      const rows = await ctx.db
        .query("assetRecipients")
        .withIndex("by_userId_and_recipientKind", (q) =>
          q.eq("userId", user._id).eq("recipientKind", kind)
        )
        .take(2000)
      for (const row of rows) {
        const current = byAsset.get(row.assetId)
        if (current === undefined) byAsset.set(row.assetId, [row.recipient])
        else current.push(row.recipient)
      }
    }

    return assets.map((asset) => ({
      id: asset._id,
      type: asset.type,
      labelSealed: asset.labelSealed,
      dekWrappedByMk: asset.dekWrappedByMk,
      recipients: byAsset.get(asset._id) ?? [],
    }))
  },
})
