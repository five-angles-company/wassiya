// Assets.
//
// `dekWrappedByMk`, `labelSealed`, `secretSealed` and every blob behind `files`
// are encrypted on the owner's device before they get here. `meta` is the only
// readable part and is typed to hold counts, sizes, mime types and a reminder
// date — nothing that would tell this deployment what an asset actually
// contains, or even what its owner calls it.
//
// The label and the secret are sealed under the asset's DEK rather than MK, so
// they open for an executor at release. Every function below passes them
// through untouched; nothing here can name an asset, including the audit log.
//
// An asset is handed over or private, and `dekWrappedByRelease` is the whole of
// that: present means handed over. Nothing here returns it — the owner's phone
// only needs to know which, and the release gate alone hands it to an executor.
//
// The subscription-lapse rule applies in exactly one place: `create`. Reads
// and the entire release path never consult the plan, because a lapsed card
// must not cost anyone their inheritance.
//
// Plan *limits* are a separate rule with a wider reach: `create` and the
// growing half of `update` both charge against them, because an edit that
// swaps a note for a 400 MB file would otherwise be a quota with a door next to
// it. Shrinking and re-wrapping stay free at any plan.
import { v } from "convex/values"

import type { Doc, Id } from "./_generated/dataModel"
import {
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server"
import { writeAudit } from "./audit"
import { assertCanAddAssets, requireUser } from "./model/access"
import { assertCanAddAsset, assertEditWithinLimits } from "./model/entitlements"
import { storageUsed } from "./model/plans"

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

const assetFile = v.object({
  storageId: v.id("_storage"),
  thumbnailId: v.optional(v.id("_storage")),
})

/** nonce(24) ‖ key(32) ‖ tag(16) — a DEK under `wrap`. */
const WRAPPED_KEY_BYTES = 72

/** `MAX_SECRET_BYTES` in `@workspace/crypto/secret`, plus nonce and tag. */
const MAX_SECRET_SEALED_BYTES = 256 * 1024 + 40

function assertSecretSize(secretSealed: ArrayBuffer | undefined): void {
  if (
    secretSealed !== undefined &&
    secretSealed.byteLength > MAX_SECRET_SEALED_BYTES
  ) {
    throw new Error("An asset secret is too large")
  }
}

/** Every blob a set of files owns, thumbnails included. */
function blobsOf(files: Doc<"assets">["files"]): Id<"_storage">[] {
  return files.flatMap((file) =>
    file.thumbnailId === undefined
      ? [file.storageId]
      : [file.storageId, file.thumbnailId]
  )
}

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

    return rows.map((row) => ({
      id: row._id,
      type: row.type,
      labelSealed: row.labelSealed,
      dekWrappedByMk: row.dekWrappedByMk,
      meta: row.meta,
      handedOver: row.dekWrappedByRelease !== undefined,
      fileCount: row.files.length,
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
    const files = await Promise.all(
      asset.files.map(async (file) => ({
        storageId: file.storageId,
        thumbnailId: file.thumbnailId ?? null,
        url: await ctx.storage.getUrl(file.storageId),
        thumbnailUrl:
          file.thumbnailId === undefined
            ? null
            : await ctx.storage.getUrl(file.thumbnailId),
      }))
    )
    return {
      id: asset._id,
      type: asset.type,
      labelSealed: asset.labelSealed,
      secretSealed: asset.secretSealed ?? null,
      meta: asset.meta,
      handedOver: asset.dekWrappedByRelease !== undefined,
      dekWrappedByMk: asset.dekWrappedByMk,
      files,
    }
  },
})

/**
 * A new asset is created private. The handover wrapper is bound to the asset's
 * id, so the phone marks it handed over right after (`setHandover`); a crash
 * in between leaves it private, which is the safe side.
 */
export const create = mutation({
  args: {
    type: assetType,
    labelSealed: v.bytes(),
    secretSealed: v.optional(v.bytes()),
    meta: assetMeta,
    dekWrappedByMk: v.bytes(),
    files: v.array(assetFile),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const now = Date.now()
    if (args.secretSealed === undefined && args.files.length === 0) {
      throw new Error("An asset needs a secret or a file")
    }
    assertSecretSize(args.secretSealed)
    // The one gate the subscription state is allowed to close. Called first and
    // on its own, so a lapsed owner is told to renew rather than to upgrade.
    assertCanAddAssets(user, now)
    await assertCanAddAsset(ctx, user, now, {
      type: args.type,
      byteSize: args.meta.byteSize ?? 0,
    })

    const assetId = await ctx.db.insert("assets", {
      userId: user._id,
      type: args.type,
      labelSealed: args.labelSealed,
      secretSealed: args.secretSealed,
      meta: args.meta,
      dekWrappedByMk: args.dekWrappedByMk,
      files: args.files,
    })
    await bumpStorageUsed(ctx, user._id, args.meta.byteSize ?? 0)
    await writeAudit(ctx, {
      userId: user._id,
      event: "asset.created",
      meta: { assetId, type: args.type, fileCount: args.files.length },
    })
    return assetId
  },
})

/**
 * Editing an asset: renaming, re-tagging, replacing the encrypted payload, and
 * re-wrapping after an MK rotation. Deliberately not gated on the subscription
 * — a lapsed card blocks *adding* assets and nothing else, so an existing vault
 * stays fully editable.
 *
 * ## `files` is a full replacement, and only the dropped blobs are deleted
 *
 * The caller sends the complete new list. Any blob on the row that is *not* in
 * that list is superseded and deleted; anything in both is retained. The set
 * difference matters — an owner adding two photos to an album of five sends
 * seven files, five of which already exist, and deleting "the old ones" would
 * destroy the five they kept.
 *
 * ## The DEK is not rotated here, on purpose
 *
 * A caller re-encrypting a payload reuses the asset's existing DEK and does not
 * pass `dekWrappedByMk`. **This is a requirement, not laziness:** a handed-over
 * asset's DEK is wrapped under the release key, so minting a fresh DEK on an
 * ordinary edit would silently break its delivery, and nothing would surface it until a claim. It is safe because the sealing
 * primitives derive fresh per-call randomness — see `wrap.ts` and
 * `assetHeader.ts`, whose salt exists precisely so a deliberately reused DEK
 * stays safe. `dekWrappedByMk` remains accepted for the one case that *is* a
 * rotation: MK itself changing.
 */
export const update = mutation({
  args: {
    assetId: v.id("assets"),
    labelSealed: v.optional(v.bytes()),
    secretSealed: v.optional(v.bytes()),
    meta: v.optional(assetMeta),
    dekWrappedByMk: v.optional(v.bytes()),
    files: v.optional(v.array(assetFile)),
  },
  handler: async (ctx, { assetId, ...fields }) => {
    const user = await requireUser(ctx)
    const asset = await ctx.db.get("assets", assetId)
    if (asset === null || asset.userId !== user._id) {
      throw new Error("Not found")
    }
    assertSecretSize(fields.secretSealed)
    const secret = fields.secretSealed ?? asset.secretSealed
    const files = fields.files ?? asset.files
    if (secret === undefined && files.length === 0) {
      // A caller bug that would leave an unopenable row behind.
      throw new Error("An asset needs a secret or a file")
    }

    // `ctx.db.patch` is shallow, so patching a partial `meta` would REPLACE the
    // object and drop whatever it omitted — `mimeType` and `itemCount` are the
    // ones that would go. Callers are expected to send a complete `meta`; this
    // merge is the safety net for the day one of them does not.
    const meta =
      fields.meta === undefined ? undefined : { ...asset.meta, ...fields.meta }

    // An edit that replaces a 1 KB note with a 400 MB file is an add in
    // everything but name, so growth is charged against the same quota — before
    // the patch, because refusing after it would leave the row and the counter
    // telling different stories. Shrinking, renaming, handing over and re-wrapping
    // stay free: a vault that cannot be repaired after a plan change would be a
    // worse outcome than one slightly over its quota.
    if (meta !== undefined) {
      const added = (meta.byteSize ?? 0) - (asset.meta.byteSize ?? 0)
      if (added > 0) {
        await assertEditWithinLimits(ctx, user, Date.now(), {
          byteSize: meta.byteSize ?? 0,
          addedBytes: added,
        })
      }
    }

    await ctx.db.patch("assets", assetId, { ...fields, ...(meta && { meta }) })

    // Deleted after the patch rather than before it: the row no longer points
    // at them, so there is no window in which it references a missing blob.
    if (fields.files !== undefined) {
      const kept = new Set<string>(blobsOf(fields.files))
      for (const storageId of blobsOf(asset.files)) {
        if (!kept.has(storageId)) {
          await ctx.storage.delete(storageId)
        }
      }
    }

    // `create` counts `meta.byteSize` and `remove` gives it back, so an edit
    // owes the difference. Credential types leave `byteSize` unset and so have
    // never been counted at all — a delta of zero keeps them that way rather
    // than half-counting them from the first edit onwards.
    if (meta !== undefined) {
      const delta = (meta.byteSize ?? 0) - (asset.meta.byteSize ?? 0)
      await bumpStorageUsed(ctx, user._id, delta)
    }

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

    for (const storageId of blobsOf(asset.files)) {
      await ctx.storage.delete(storageId)
    }
    await ctx.db.delete("assets", assetId)
    await bumpStorageUsed(ctx, user._id, -(asset.meta.byteSize ?? 0))

    await writeAudit(ctx, {
      userId: user._id,
      event: "asset.removed",
      meta: { assetId },
    })
    return null
  },
})

/**
 * Hand an asset over, or make it private. Handing over takes the DEK wrapped
 * under the owner's release key on the phone; private deletes that wrapper, so
 * nothing but MK can open the asset and it dies with the owner.
 */
export const setHandover = mutation({
  args: {
    assetId: v.id("assets"),
    /** Absent makes the asset private. */
    dekWrappedByRelease: v.optional(v.bytes()),
  },
  handler: async (ctx, { assetId, dekWrappedByRelease }) => {
    const user = await requireUser(ctx)
    const asset = await ctx.db.get("assets", assetId)
    if (asset === null || asset.userId !== user._id) {
      throw new Error("Not found")
    }
    if (
      dekWrappedByRelease !== undefined &&
      dekWrappedByRelease.byteLength !== WRAPPED_KEY_BYTES
    ) {
      throw new Error("Malformed handover wrapper")
    }
    await ctx.db.patch("assets", assetId, { dekWrappedByRelease })
    await writeAudit(ctx, {
      userId: user._id,
      event: "asset.handover_changed",
      meta: { assetId, handedOver: dekWrappedByRelease !== undefined },
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
  await ctx.db.patch("users", userId, {
    storageBytesUsed: Math.max(0, storageUsed(user) + delta),
  })
}

/**
 * Record that the owner revealed this asset's secret.
 *
 * 4.9 requires it: *"every reveal writes an audit entry (9.3) and the last one
 * is stamped under the button"*. The point is not bookkeeping — it is that a
 * vault whose secrets can be read without leaving a trace cannot tell its owner
 * whether anyone else has read them. The stamp under the button is that trace
 * made visible on the screen where it matters.
 *
 * `auditLog` deliberately has no client-callable write anywhere else; this is
 * the one, and it is narrow on purpose — the caller chooses *which of their own
 * assets*, and nothing else. The event name, the timestamp and the user are all
 * decided here, so a client cannot forge a line or backdate one.
 */
export const recordReveal = mutation({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    const user = await requireUser(ctx)
    const asset = await ctx.db.get("assets", assetId)
    if (asset === null || asset.userId !== user._id) {
      throw new Error("Not found")
    }
    await writeAudit(ctx, {
      userId: user._id,
      event: REVEAL_EVENT,
      // `type` is already a plaintext column on the row and is already logged
      // by `asset.created`, so recording it here tells the deployment nothing
      // new and keeps ٩.٣ able to say *what kind* of thing was opened. What
      // must never appear is the asset's **name**: that is `labelSealed`, and
      // a log that reconstructed it would undo the reason it is sealed.
      meta: { assetId, type: asset.type },
    })
    return null
  },
})

/**
 * When this asset's secret was last revealed, or null if never.
 *
 * Scans the owner's log newest-first for the most recent matching entry.
 * `auditLog` is indexed by user and time, not by asset, so this is a bounded
 * reverse walk rather than a lookup: past {@link REVEAL_SCAN_LIMIT} entries it
 * gives up and answers null.
 *
 * That bound is a deliberate trade. Indexing the log by asset would mean a
 * second index on an append-only table that exists to be read in time order,
 * and the honest failure — "we cannot see a reveal that old" — is far better
 * than the alternative, which would be to keep a mutable `lastRevealedAt`
 * column on `assets` that a future writer could quietly reset.
 */
const REVEAL_EVENT = "asset.revealed"
const REVEAL_SCAN_LIMIT = 500

export const lastRevealedAt = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    const user = await requireUser(ctx)
    const recent = await ctx.db
      .query("auditLog")
      .withIndex("by_userId_and_at", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(REVEAL_SCAN_LIMIT)

    const hit = recent.find(
      (row) => row.event === REVEAL_EVENT && row.meta.assetId === assetId
    )
    return hit?.at ?? null
  },
})
