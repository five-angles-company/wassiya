// Stored blobs: which ones something references, and the one place any is
// deleted.
//
// Rules this file holds up (`verify-invariants.mjs` enforces the first two):
//
// - **Every reference is held.** A row that takes a blob — an asset's file or
//   thumbnail, a claim's certificate, a support attachment — calls `holdBlobs`
//   in the same mutation. `storage.sweep` deletes an unheld blob two days after
//   upload, so a reference written without it is a file lost two days later.
// - **Blobs are deleted only by `dropBlobs`**, which removes the hold with the
//   blob, so the registry never names a file that is gone.
// - **No blob joins a row more than `JOIN_WINDOW_MS` after upload.** That is
//   what makes the sweep safe: a blob unheld at `SWEEP_AFTER_MS` never will be.
//   Every caller of `freshUpload` passes a window no longer than this one.
// - **The sweep never reads back past its own first run.** Blobs stored before
//   the registry existed have no holds, and are never touched.
import type { DocumentByName, SystemDataModel } from "convex/server"

import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"

type StoredBlob = DocumentByName<SystemDataModel, "_storage">

const DAY_MS = 24 * 60 * 60 * 1000

export const JOIN_WINDOW_MS = DAY_MS
export const SWEEP_AFTER_MS = 2 * DAY_MS
const SWEEP_BATCH = 200

type BlobKind = Doc<"storageRefs">["kind"]

async function isHeld(ctx: QueryCtx, storageId: Id<"_storage">): Promise<boolean> {
  const ref = await ctx.db
    .query("storageRefs")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .first()
  return ref !== null
}

/**
 * An upload that may still join a row: stored, held by nothing, and uploaded
 * within `withinMs`. Null otherwise; the caller refuses in its own terms and
 * checks the type and size its row allows.
 */
export async function freshUpload(
  ctx: QueryCtx,
  storageId: Id<"_storage">,
  now: number,
  withinMs: number = JOIN_WINDOW_MS
): Promise<StoredBlob | null> {
  const blob = await ctx.db.system.get("_storage", storageId)
  if (blob === null || now - blob._creationTime > withinMs) return null
  if (await isHeld(ctx, storageId)) return null
  return blob
}

export async function holdBlobs(
  ctx: MutationCtx,
  storageIds: readonly Id<"_storage">[],
  kind: BlobKind
): Promise<void> {
  for (const storageId of storageIds) {
    await ctx.db.insert("storageRefs", { storageId, kind })
  }
}

export async function dropBlobs(
  ctx: MutationCtx,
  storageIds: readonly Id<"_storage">[]
): Promise<void> {
  for (const storageId of storageIds) {
    const refs = await ctx.db
      .query("storageRefs")
      .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
      .take(10)
    for (const ref of refs) {
      await ctx.db.delete("storageRefs", ref._id)
    }
    await ctx.storage.delete(storageId)
  }
}

/**
 * One pass of the orphan sweep: delete every unheld blob uploaded after the
 * sweep's cursor and more than `SWEEP_AFTER_MS` ago, oldest first. The first
 * run only sets the cursor.
 */
export async function sweepUnheldBatch(
  ctx: MutationCtx,
  now: number
): Promise<{ scanned: number; deleted: number; more: boolean }> {
  const cursor = await ctx.db.query("storageSweep").first()
  if (cursor === null) {
    await ctx.db.insert("storageSweep", { sweptThrough: now })
    return { scanned: 0, deleted: 0, more: false }
  }

  const blobs = await ctx.db.system
    .query("_storage")
    .withIndex("by_creation_time", (q) =>
      q
        .gt("_creationTime", cursor.sweptThrough)
        .lte("_creationTime", now - SWEEP_AFTER_MS)
    )
    .take(SWEEP_BATCH)

  let deleted = 0
  for (const blob of blobs) {
    if (!(await isHeld(ctx, blob._id))) {
      await ctx.storage.delete(blob._id)
      deleted += 1
    }
  }
  const last = blobs.at(-1)
  if (last !== undefined) {
    await ctx.db.patch("storageSweep", cursor._id, {
      sweptThrough: last._creationTime,
    })
  }
  return { scanned: blobs.length, deleted, more: blobs.length === SWEEP_BATCH }
}
