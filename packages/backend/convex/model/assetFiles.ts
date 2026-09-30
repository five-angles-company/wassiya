// Which uploaded blobs an asset may name, and what they weigh.
//
// Every vault file is ciphertext the phone uploads moments before it writes the
// row, typed `application/octet-stream` (`lib/asset-upload.ts`). A blob new to
// a row must be exactly that — opaque, recent and held by nothing — or
// `assets.get` would hand back a public link to whatever a modified client
// uploaded, readable or not, and Wassiya would be hosting it. "Held by
// nothing" also stops a row from naming someone else's blob, which `remove`
// would then delete.
//
// The support chat holds the mirror rule (`model/support.ts`): its allow-list
// excludes octet-stream, so no blob can serve both sides.
//
// The size charged against the plan is measured from storage here. The phone's
// `meta.byteSize` is ignored: trusting it was a quota anyone could opt out of.
import type { Doc, Id } from "../_generated/dataModel"
import type { QueryCtx } from "../_generated/server"
import { freshUpload } from "./storage"

export const VAULT_BLOB_TYPE = "application/octet-stream"

type AssetFiles = Doc<"assets">["files"]

/** Every blob a set of files owns, thumbnails included. */
export function blobsOf(files: AssetFiles): Id<"_storage">[] {
  return files.flatMap((file) =>
    file.thumbnailId === undefined
      ? [file.storageId]
      : [file.storageId, file.thumbnailId]
  )
}

/**
 * The stored size of `files`, thumbnails included (undefined when there are
 * none), and the blobs new to the row, which the caller must hold. Blobs in
 * `onRow` are already the asset's and pass as they are. A blob named twice is
 * refused: the row would count it twice and `remove` would delete it twice.
 */
export async function measureFiles(
  ctx: QueryCtx,
  files: AssetFiles,
  onRow: ReadonlySet<string>,
  now: number
): Promise<{ byteSize: number | undefined; added: Id<"_storage">[] }> {
  const seen = new Set<string>()
  const added: Id<"_storage">[] = []
  let total = 0
  for (const storageId of blobsOf(files)) {
    if (seen.has(storageId)) throw new Error("File not accepted")
    seen.add(storageId)
    const kept = onRow.has(storageId)
    const blob = kept
      ? await ctx.db.system.get("_storage", storageId)
      : await freshUpload(ctx, storageId, now)
    if (blob === null || (!kept && blob.contentType !== VAULT_BLOB_TYPE)) {
      throw new Error("File not accepted")
    }
    if (!kept) added.push(storageId)
    total += blob.size
  }
  return { byteSize: files.length === 0 ? undefined : total, added }
}
