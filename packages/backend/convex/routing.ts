// Routing: which recipient gets which asset, whole.
//
// No share arithmetic exists here or anywhere else in this deployment. An asset
// goes to an heir, to the executor, or to all heirs — never to "one third of".
//
// Every write is `setRecipients`, which replaces an asset's routing atomically.
// That is deliberate: routing changes invalidate release bundles, and a
// half-applied edit would leave a bundle describing a state that never existed.
// The client's obligation after any call here is to rebuild the affected heirs'
// bundles and call `release.saveBundles`; `staleHeirs` below tells it which.
import { v } from "convex/values"

import type { Doc, Id } from "./_generated/dataModel"
import { mutation, query, type MutationCtx } from "./_generated/server"
import { writeAudit } from "./audit"
import { requireUser } from "./model/access"

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
    return rows.map((row) => ({
      id: row._id,
      recipient: row.recipient,
      hasInstructions: row.instructionsCiphertext !== undefined,
    }))
  },
})

/**
 * Replace an asset's routing wholesale. `instructionsCiphertext` is encrypted
 * on-device under the same DEK path as the asset, so it is opaque here.
 */
export const setRecipients = mutation({
  args: {
    assetId: v.id("assets"),
    recipients: v.array(
      v.object({
        recipient: recipientValidator,
        instructionsCiphertext: v.optional(v.bytes()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const asset = await ctx.db.get("assets", args.assetId)
    if (asset === null || asset.userId !== user._id) {
      throw new Error("Not found")
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
        instructionsCiphertext: entry.instructionsCiphertext,
      })
    }

    await ctx.db.patch("assets", args.assetId, {
      recipientRule: args.recipients.length === 0 ? "default" : "explicit",
    })
    // Stamp every heir whose bundle this change invalidates — the ones routed
    // before, the ones routed now, and (for an "allHeirs" entry on either side)
    // everyone. `release.saveBundles` is what clears the stamp.
    await markRoutingChanged(ctx, user._id, [...existing, ...args.recipients])
    await writeAudit(ctx, {
      userId: user._id,
      event: "routing.changed",
      meta: { assetId: args.assetId, recipientCount: args.recipients.length },
    })
    return null
  },
})

/**
 * Exactly what one heir would receive — the heir-preview screen, and the input
 * the owner's device uses to rebuild that heir's bundle.
 *
 * "allHeirs" routes are folded in here rather than expanded at write time, so
 * adding an heir later picks them up without rewriting every routing row.
 */
export const previewForHeir = query({
  args: { heirId: v.id("heirs") },
  handler: async (ctx, { heirId }) => {
    const user = await requireUser(ctx)
    const heir = await ctx.db.get("heirs", heirId)
    if (heir === null || heir.userId !== user._id) {
      throw new Error("Not found")
    }

    const direct = await ctx.db
      .query("assetRecipients")
      .withIndex("by_userId_and_recipientHeirId", (q) =>
        q.eq("userId", user._id).eq("recipientHeirId", heirId)
      )
      .take(500)
    // Queried on its own index rather than filtered out of the
    // `recipientHeirId: undefined` window, which also holds every executor row:
    // an owner with 500+ executor routes would otherwise push an "allHeirs" row
    // past the take() limit and silently drop that asset from this heir's
    // bundle. A wrong bundle is worse than a slow one.
    const shared = await ctx.db
      .query("assetRecipients")
      .withIndex("by_userId_and_recipientKind", (q) =>
        q.eq("userId", user._id).eq("recipientKind", "allHeirs")
      )
      .take(500)

    const items = []
    for (const row of [...direct, ...shared]) {
      const asset = await ctx.db.get("assets", row.assetId)
      if (asset === null) {
        continue
      }
      items.push({
        assetId: asset._id,
        type: asset.type,
        title: asset.title,
        meta: asset.meta,
        via: row.recipient.kind,
        dekWrappedByMk: asset.dekWrappedByMk,
        instructionsCiphertext: row.instructionsCiphertext ?? null,
      })
    }

    return {
      heir: { id: heir._id, name: heir.name, mode: heir.mode },
      messageKind: heir.messageMeta?.kind ?? null,
      items,
    }
  },
})

/**
 * Heirs whose stored bundle predates the newest routing change, i.e. the set
 * the owner's device still owes a rebuild for. Drives the "protection needs
 * attention" state rather than silently leaving heirs with a stale bundle.
 */
export const staleHeirs = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const heirs = await ctx.db
      .query("heirs")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100)

    const stale = []
    for (const heir of heirs) {
      const bundle = await ctx.db
        .query("releaseBundles")
        .withIndex("by_userId_and_heirId", (q) =>
          q.eq("userId", user._id).eq("heirId", heir._id)
        )
        .unique()
      const changedAt = heir.routingChangedAt ?? 0
      if (bundle === null || bundle.rebuiltAt < changedAt) {
        stale.push({
          heirId: heir._id,
          name: heir.name,
          hasBundle: bundle !== null,
        })
      }
    }
    return stale
  },
})

function heirIdOf(recipient: Recipient): Id<"heirs"> | undefined {
  return recipient.kind === "heir" ? recipient.heirId : undefined
}

/**
 * Stamp `routingChangedAt` on every heir affected by a routing edit. An
 * "allHeirs" entry on either side of the edit touches everyone, because that is
 * exactly the set whose bundle contents move.
 */
async function markRoutingChanged(
  ctx: MutationCtx,
  userId: Id<"users">,
  touched: { recipient: Recipient }[]
): Promise<void> {
  const now = Date.now()
  const everyone = touched.some((row) => row.recipient.kind === "allHeirs")
  if (everyone) {
    const heirs = await ctx.db
      .query("heirs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(100)
    for (const heir of heirs) {
      await ctx.db.patch("heirs", heir._id, { routingChangedAt: now })
    }
    return
  }
  const seen = new Set<Id<"heirs">>()
  for (const row of touched) {
    if (row.recipient.kind !== "heir" || seen.has(row.recipient.heirId)) {
      continue
    }
    seen.add(row.recipient.heirId)
    await ctx.db.patch("heirs", row.recipient.heirId, {
      routingChangedAt: now,
    })
  }
}
