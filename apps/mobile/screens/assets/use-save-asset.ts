/**
 * The one path from a filled-in form to a row in `assets`, for a new asset and
 * an edited one alike. Everything that makes an asset safe happens here:
 *
 *   1. a fresh DEK for a new asset — or, for an edit, the asset's own DEK
 *      unwrapped from the row. **Never a new one on an edit:** a routed asset's
 *      DEK is sealed to the escrow key, and a new DEK would leave that sealed
 *      copy opening nothing, silently, until a claim;
 *   2. the label and the secret sealed under that DEK;
 *   3. every new file (and its thumbnail) encrypted before a byte leaves the
 *      device, each as its own blob;
 *   4. the DEK zeroed, whatever happened.
 *
 * Blobs upload before the row is written: a crash between them leaves orphaned
 * ciphertext nobody can open, where the reverse order would leave a row naming
 * blobs that do not exist. A new asset is always unrouted; routing is its own
 * save, on the recipients screen.
 */
import { useCallback } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { encryptAsset } from "@workspace/crypto/asset"
import { generateDek } from "@workspace/crypto/keys"
import { sealLabel, type AssetLabel } from "@workspace/crypto/label"
import { sealSecret } from "@workspace/crypto/secret"
import { unwrap, wrap } from "@workspace/crypto/wrap"

import { uploadCiphertext, type UploadProgress } from "@/lib/asset-upload"
import type { AssetType } from "@/lib/asset-types"
import { ensureWebCrypto } from "@/lib/crypto-polyfill"
import { useVault } from "@/stores/vault"

/** A blob already in storage that survives this save untouched. */
export type StoredFile = {
  storageId: Id<"_storage">
  thumbnailId?: Id<"_storage"> | null
}

/**
 * A file to encrypt and upload. `read` is a thunk, not bytes: an album of
 * twenty full-resolution photos handed over as bytes would all be resident
 * before the first upload, which is where a mid-range handset runs out of
 * memory. Reading inside the loop keeps one plaintext buffer alive at a time.
 */
export type NewFile = {
  read: () => Promise<Uint8Array>
  readThumbnail?: () => Promise<Uint8Array>
  /** Bytes on the wire, for the meta counters. */
  byteSize?: number
}

export type FileInput = { kept: StoredFile } | NewFile

export type AssetMeta = {
  itemCount?: number
  byteSize?: number
  mimeType?: string
  expiryRemindAt?: number
}

export type SaveAssetInput = {
  /** Absent creates a new asset; present edits that one under its own DEK. */
  existing?: { assetId: Id<"assets">; dekWrappedByMk: ArrayBuffer }
  type: AssetType
  label: AssetLabel
  secret?: string
  /**
   * The asset's complete file list, in order. Absent on an edit leaves the
   * stored files as they are; on a create it means there are none.
   */
  files?: FileInput[]
  /** Non-sensitive counters only; the server may read every field of this. */
  meta?: AssetMeta
  /** Reported per entry of `files`, for the new ones. */
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
}

export class VaultLockedError extends Error {
  constructor() {
    super("The vault must be unlocked before an asset can be saved")
    this.name = "VaultLockedError"
  }
}

export function useSaveAsset(): (input: SaveAssetInput) => Promise<Id<"assets">> {
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl)
  const create = useMutation(api.assets.create)
  const update = useMutation(api.assets.update)

  return useCallback(
    async (input: SaveAssetInput) => {
      // Read at call time, not at mount: a form that grabbed MK when it opened
      // could hold a key the lock has since cleared.
      const mk = useVault.getState().mk
      if (mk === null) throw new VaultLockedError()

      // Hermes has no Web Crypto global and `generateDek` refuses without one.
      ensureWebCrypto()
      const dek =
        input.existing === undefined
          ? generateDek()
          : unwrap(new Uint8Array(input.existing.dekWrappedByMk), mk)

      const encryptAndUpload = async (
        read: () => Promise<Uint8Array>,
        onProgress?: (progress: UploadProgress) => void
      ): Promise<Id<"_storage">> => {
        const plaintext = await read()
        const ciphertext = encryptAsset(plaintext, dek)
        plaintext.fill(0)
        const url = await generateUploadUrl({})
        return (await uploadCiphertext(ciphertext, url, onProgress)) as Id<"_storage">
      }

      try {
        const labelSealed = toArrayBuffer(sealLabel(input.label, dek))
        const secretSealed =
          input.secret === undefined
            ? undefined
            : toArrayBuffer(sealSecret(input.secret, dek))

        let files: { storageId: Id<"_storage">; thumbnailId?: Id<"_storage"> }[] | undefined
        if (input.files !== undefined) {
          files = []
          for (const [index, file] of input.files.entries()) {
            if ("kept" in file) {
              files.push({
                storageId: file.kept.storageId,
                thumbnailId: file.kept.thumbnailId ?? undefined,
              })
              continue
            }
            const storageId = await encryptAndUpload(file.read, (progress) =>
              input.onProgress?.(index, progress)
            )
            const thumbnailId =
              file.readThumbnail === undefined
                ? undefined
                : await encryptAndUpload(file.readThumbnail)
            files.push({ storageId, thumbnailId })
          }
        }

        if (input.existing !== undefined) {
          await update({
            assetId: input.existing.assetId,
            labelSealed,
            secretSealed,
            meta: input.meta,
            files,
          })
          return input.existing.assetId
        }
        return await create({
          type: input.type,
          labelSealed,
          secretSealed,
          meta: input.meta ?? {},
          dekWrappedByMk: toArrayBuffer(wrap(dek, mk)),
          files: files ?? [],
        })
      } finally {
        dek.fill(0)
      }
    },
    [create, generateUploadUrl, update]
  )
}

/**
 * Convex `v.bytes()` is an `ArrayBuffer`. Copying rather than handing over
 * `bytes.buffer` matters: `@workspace/crypto` builds its outputs with
 * `subarray`, so the underlying buffer can be larger than the view and passing
 * it raw would ship trailing bytes.
 */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer
}
