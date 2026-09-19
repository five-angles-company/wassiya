// Release bundles — the crown-jewel file.
//
// `releaseBundles.lockedKey` is an heir's K_h, locked on the owner's device to
// the escrow public key. Unlocking it is the single irreversible act this
// deployment can perform, so the rules here are absolute:
//
//   1. `lockedKey` is written by `saveBundles` and read by `releaseGate` — an
//      internal query whose only caller is `escrow.openDelivery`, the one
//      unlock path. `pnpm --filter @workspace/backend verify` fails the build
//      if a third read appears.
//   2. Nothing in this file returns a `releaseBundles` document, and nothing
//      spreads one. Every read projects named fields, so a future edit cannot
//      leak the locked key by widening a return type.
//   3. `releaseGate` re-reads the delivery, the claim and the caller and checks
//      every precondition itself. It never trusts a caller-side check, a
//      passed-in flag, or the fact that some earlier function already looked.
import { v } from "convex/values"

import type { Doc } from "./_generated/dataModel"
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server"
import { writeAudit } from "./audit"
import { requireUser } from "./model/access"
import { getCurrentUserOrThrow } from "./users"

// RSA-OAEP output is the modulus length: 384 bytes for 3072-bit keys, 512 for
// 4096. Anything else was not produced by `@workspace/crypto/escrow`.
const LOCKED_KEY_BYTES = [384, 512]

/**
 * The owner's device uploads a rebuilt bundle per heir after any routing
 * change, replacing that heir's row wholesale. K_h is fresh on every rebuild,
 * so a bundle superseded here opens nothing afterwards.
 *
 * `escrowKeyId` must be the key this deployment currently unlocks with
 * (`ESCROW_KEY_ID`): a client still pinned to a retired key would otherwise
 * write bundles nobody can open.
 */
export const saveBundles = mutation({
  args: {
    bundles: v.array(
      v.object({
        heirId: v.id("heirs"),
        bundleStorageId: v.id("_storage"),
        lockedKey: v.bytes(),
        escrowKeyId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const now = Date.now()
    const currentKeyId = process.env.ESCROW_KEY_ID
    if (currentKeyId === undefined) {
      throw new Error("ESCROW_KEY_ID is not set on this deployment")
    }

    for (const bundle of args.bundles) {
      const heir = await ctx.db.get("heirs", bundle.heirId)
      if (heir === null || heir.userId !== user._id) {
        throw new Error("Not found")
      }
      if (bundle.escrowKeyId !== currentKeyId) {
        throw new Error("Locked with an escrow key this deployment does not use")
      }
      if (!LOCKED_KEY_BYTES.includes(bundle.lockedKey.byteLength)) {
        throw new Error("Malformed locked key")
      }

      const existing = await ctx.db
        .query("releaseBundles")
        .withIndex("by_userId_and_heirId", (q) =>
          q.eq("userId", user._id).eq("heirId", bundle.heirId)
        )
        .unique()

      const fields = {
        userId: user._id,
        heirId: bundle.heirId,
        bundleStorageId: bundle.bundleStorageId,
        lockedKey: bundle.lockedKey,
        escrowKeyId: bundle.escrowKeyId,
        rebuiltAt: now,
      }
      if (existing === null) {
        await ctx.db.insert("releaseBundles", fields)
      } else {
        if (existing.bundleStorageId !== bundle.bundleStorageId) {
          await ctx.storage.delete(existing.bundleStorageId)
        }
        await ctx.db.replace("releaseBundles", existing._id, fields)
      }
    }

    await writeAudit(ctx, {
      userId: user._id,
      event: "release.bundles_rebuilt",
      meta: { heirCount: args.bundles.length },
    })
    return null
  },
})

/**
 * Owner-facing status. Reports only *whether* a bundle exists and when it was
 * rebuilt — never the locked key.
 */
export const status = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const rows = await ctx.db
      .query("releaseBundles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100)
    return rows.map((row) => ({
      heirId: row.heirId,
      rebuiltAt: row.rebuiltAt,
    }))
  },
})

/**
 * Every precondition for opening a delivery, re-read now. Returns the
 * delivery, claim and bundle, or null — callers must treat null as "not found"
 * and say nothing more.
 */
async function openableDelivery(
  ctx: QueryCtx,
  deliveryId: Doc<"deliveries">["_id"]
): Promise<{
  delivery: Doc<"deliveries">
  bundle: Doc<"releaseBundles">
} | null> {
  const caller = await getCurrentUserOrThrow(ctx)
  const delivery = await ctx.db.get("deliveries", deliveryId)
  if (delivery === null) return null
  if (delivery.status !== "ready") return null
  if (delivery.destroyedAt !== undefined) return null
  if (delivery.expiresAt <= Date.now()) return null
  if (delivery.heirUserId !== caller._id) return null
  if (caller.identityStatus !== "verified") return null

  const claim = await ctx.db.get("claims", delivery.claimId)
  if (claim === null || claim.status !== "released") return null
  if (claim.nameMatch !== true) return null
  if (claim.subjectUserId !== delivery.subjectUserId) return null

  const bundle = await ctx.db
    .query("releaseBundles")
    .withIndex("by_userId_and_heirId", (q) =>
      q.eq("userId", delivery.subjectUserId).eq("heirId", delivery.heirId)
    )
    .unique()
  if (bundle === null) return null
  return { delivery, bundle }
}

/**
 * THE gated read of `lockedKey`. Internal: its only caller is
 * `escrow.openDelivery`, which runs as the heir, so `getCurrentUserOrThrow`
 * inside sees the heir's own identity.
 */
export const releaseGate = internalQuery({
  args: { deliveryId: v.id("deliveries") },
  handler: async (ctx, { deliveryId }) => {
    const openable = await openableDelivery(ctx, deliveryId)
    if (openable === null) return null
    const { delivery, bundle } = openable
    return {
      subjectUserId: delivery.subjectUserId,
      heirId: delivery.heirId,
      bundleUrl: await ctx.storage.getUrl(bundle.bundleStorageId),
      lockedKey: bundle.lockedKey,
      escrowKeyId: bundle.escrowKeyId,
      expiresAt: delivery.expiresAt,
    }
  },
})

/** Logged before the unlock runs, so an attempt that fails is still on record. */
export const recordOpened = internalMutation({
  args: { deliveryId: v.id("deliveries") },
  handler: async (ctx, { deliveryId }) => {
    const delivery = await ctx.db.get("deliveries", deliveryId)
    if (delivery === null) return null
    const now = Date.now()
    await ctx.db.patch("deliveries", deliveryId, { lastOpenedAt: now })
    await writeAudit(ctx, {
      userId: delivery.subjectUserId,
      event: "release.delivery_opened",
      meta: {
        deliveryId,
        heirId: delivery.heirId,
        heirUserId: delivery.heirUserId ?? null,
      },
      at: now,
    })
    return null
  },
})

/**
 * The assets in a delivery, for an heir who can open it.
 *
 * A query: it hands out **no key material**. The ciphertext is useless without
 * the DEKs in the bundle, and each label is sealed under its asset's DEK. The
 * preconditions are the gate's own, re-asserted rather than inherited.
 */
export const assetsForDelivery = query({
  args: { deliveryId: v.id("deliveries") },
  handler: async (ctx, { deliveryId }) => {
    const openable = await openableDelivery(ctx, deliveryId)
    if (openable === null) return null
    const { delivery } = openable
    const subjectUserId = delivery.subjectUserId
    const heirId = delivery.heirId

    // Two indexed reads rather than one filtered scan: an owner with hundreds
    // of executor rows would otherwise push an "allHeirs" row past the window
    // and silently drop an asset out of an heir's inheritance.
    const direct = await ctx.db
      .query("assetRecipients")
      .withIndex("by_userId_and_recipientHeirId", (q) =>
        q.eq("userId", subjectUserId).eq("recipientHeirId", heirId)
      )
      .take(500)
    const shared = await ctx.db
      .query("assetRecipients")
      .withIndex("by_userId_and_recipientKind", (q) =>
        q.eq("userId", subjectUserId).eq("recipientKind", "allHeirs")
      )
      .take(500)

    const items = []
    for (const row of [...direct, ...shared]) {
      const asset = await ctx.db.get("assets", row.assetId)
      if (asset === null) continue

      const contentUrls: string[] = []
      for (const storageId of asset.storageIds) {
        const url = await ctx.storage.getUrl(storageId)
        if (url !== null) contentUrls.push(url)
      }

      items.push({
        assetId: asset._id,
        type: asset.type,
        labelSealed: asset.labelSealed,
        meta: asset.meta,
        via: row.recipient.kind,
        contentUrls,
        instructionsCiphertext: row.instructionsCiphertext ?? null,
      })
    }

    const heir = await ctx.db.get("heirs", heirId)
    return {
      heirName: heir?.name ?? null,
      messageKind: heir?.messageMeta?.kind ?? null,
      // Sealed under the message key the heir holds in the bundle.
      messageUrl:
        heir?.messageMeta === undefined
          ? null
          : await ctx.storage.getUrl(heir.messageMeta.storageId),
      items,
    }
  },
})
