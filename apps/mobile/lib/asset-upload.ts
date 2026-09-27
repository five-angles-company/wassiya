/**
 * Getting encrypted bytes to and from Convex file storage, via a file rather
 * than `fetch(url, { body })`.
 *
 * React Native's `Blob` cannot be constructed from a typed array — a
 * `Uint8Array` silently stringifies to `"[object Uint8Array]"`, uploading 22
 * bytes of ASCII in place of the ciphertext and reporting success. That is the
 * worst shape a vault bug can take: a real row, a real storage id, no content.
 * expo-file-system's `File` implements `Blob` natively, so writing to a real
 * file avoids the conversion entirely — and keeps tens-of-megabyte albums off
 * the JS heap.
 *
 * **Ciphertext only ever touches the disk.** The staged file holds encrypted
 * bytes only, lives in the cache directory, and is deleted in a `finally`.
 *
 * **A file is encrypted one chunk at a time** (`encryptFileAndUpload`): read a
 * chunk from the plaintext file, encrypt it, append it to the staged file. The
 * heap holds one chunk whatever the file's size — a long video read whole would
 * not fit, and would take the app down mid-save.
 */
import { createAssetHeader, encryptChunk } from "@workspace/crypto/asset"
import { randomUUID } from "expo-crypto"
import { File, FileMode, Paths, UploadType } from "expo-file-system"

/** Progress for one blob, forwarded to a wizard's progress bar. */
export type UploadProgress = { bytesSent: number; totalBytes: number }

/**
 * Encrypt a plaintext file on disk under `dek`, chunk by chunk, upload it and
 * return its storage id. The output is the same `header ‖ chunk₀ ‖ chunk₁ ‖ …`
 * format `encryptAsset` builds, so every reader opens it unchanged.
 *
 * @param uploadUrl a fresh URL from `assets.generateUploadUrl` — Convex issues
 *   these one per file, so callers must not reuse one across blobs.
 */
export async function encryptFileAndUpload(
  uri: string,
  dek: Uint8Array,
  uploadUrl: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const source = new File(uri)
  const total = source.size ?? 0
  const header = createAssetHeader(total)
  const staged = stagingFile()
  try {
    const input = source.open(FileMode.ReadOnly)
    const output = staged.open(FileMode.WriteOnly)
    try {
      output.writeBytes(header.bytes)
      for (let index = 0; index < header.chunkCount; index++) {
        const length = Math.min(header.chunkSize, total - index * header.chunkSize)
        const plaintext = input.readBytes(length)
        output.writeBytes(encryptChunk(dek, header, index, plaintext))
        plaintext.fill(0)
      }
    } finally {
      input.close()
      output.close()
    }
    return await uploadStaged(staged, uploadUrl, onProgress)
  } finally {
    // `exists` first: a failure before `create` completed would make this throw
    // and mask the real error.
    if (staged.exists) staged.delete()
  }
}

/** A fresh name per call, so two uploads in flight never share a file. */
function stagingFile(): File {
  const staged = new File(Paths.cache, `wsy-upload-${randomUUID()}.bin`)
  staged.create({ overwrite: true })
  return staged
}

async function uploadStaged(
  staged: File,
  uploadUrl: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const result = await staged.upload(uploadUrl, {
    httpMethod: "POST",
    uploadType: UploadType.BINARY_CONTENT,
    // Convex stores whatever it is told; the bytes are opaque either way, and
    // claiming a real mime type here would describe the plaintext, not what
    // was actually stored.
    headers: { "Content-Type": "application/octet-stream" },
    onProgress: onProgress
      ? ({ bytesSent, totalBytes }) => onProgress({ bytesSent, totalBytes })
      : undefined,
  })

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload failed with status ${result.status}`)
  }
  const parsed: unknown = JSON.parse(result.body)
  const storageId = (parsed as { storageId?: unknown }).storageId
  if (typeof storageId !== "string") {
    throw new Error("Upload response did not contain a storageId")
  }
  return storageId
}

/**
 * Delete a local plaintext artefact once its encrypted copy exists — a scanned
 * PDF, a generated thumbnail. Safe to call on something already gone.
 */
export function discardLocalFile(uri: string): void {
  const file = new File(uri)
  if (file.exists) file.delete()
}

/**
 * Delete the image picker's copy of a chosen file — a plaintext duplicate that
 * can run to gigabytes for a video. Only a file inside this app's cache is
 * touched: anything else is the owner's own, however its uri reached us.
 */
export function discardCachedCopy(uri: string): void {
  if (uri.startsWith(Paths.cache.uri)) discardLocalFile(uri)
}

/** Size in bytes of a picked file, or 0 when the platform will not say. */
export function fileSize(uri: string): number {
  return new File(uri).size ?? 0
}

/**
 * Fetch one encrypted blob back and hand over its bytes.
 *
 * The mirror of {@link encryptFileAndUpload}, and it goes through a file for the
 * same reason: React Native's `fetch` has no dependable typed-array response
 * path, while expo-file-system streams the body straight to disk. Only
 * ciphertext ever lands there — decryption happens in memory after this
 * returns, and the staged file is deleted either way.
 *
 * `idempotent` because a retry after a failed decrypt would otherwise reject on
 * the leftover file rather than re-downloading.
 */
export async function downloadCiphertext(url: string): Promise<Uint8Array> {
  const staged = new File(Paths.cache, `wsy-download-${randomUUID()}.bin`)
  try {
    const downloaded = await File.downloadFileAsync(url, staged, {
      idempotent: true,
    })
    return await downloaded.bytes()
  } finally {
    if (staged.exists) staged.delete()
  }
}
