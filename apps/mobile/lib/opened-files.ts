/**
 * Opening one of the owner's own files: decrypted to a temporary file that a
 * player or the system share sheet can read.
 *
 * ⚠️ **This is the one place a decrypted vault file touches the disk, and only
 * because the owner asked to open it.** A player and the OS open files, not
 * memory. So the plaintext lives in one folder of the app's own cache
 * (`opened/`), each screen deletes what it opened when it closes, and
 * `sweepOpenedFiles` empties the folder at every launch — a crash or a killed
 * app cannot leave a copy behind longer than until the next start. Photos never
 * come here: they open in memory (`usePhotoOriginal`).
 *
 * Decryption streams chunk by chunk, like the upload: a long video must never
 * be held whole in memory.
 */
import { createAssetDecryptor } from "@workspace/crypto/asset"
import { randomUUID } from "expo-crypto"
import { Directory, File, FileMode, Paths } from "expo-file-system"

const OPENED = new Directory(Paths.cache, "opened")

/** Reading the ciphertext this much at a time keeps the heap to one chunk. */
const READ_BYTES = 1024 * 1024

const EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "audio/mp4": "m4a",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
}

/** The extension a viewer needs to know what it was handed. */
export function extensionFor(mimeType: string): string {
  return EXTENSIONS[mimeType] ?? "bin"
}

/**
 * Download one stored blob and decrypt it into `opened/`, returning the
 * plaintext file. Throws on any tampering — `finish` refuses a truncated blob —
 * and leaves nothing behind when it does.
 */
export async function decryptToFile(
  url: string,
  dek: Uint8Array,
  mimeType: string
): Promise<File> {
  OPENED.create({ intermediates: true, idempotent: true })
  const staged = new File(Paths.cache, `wsy-download-${randomUUID()}.bin`)
  const output = new File(OPENED, `${randomUUID()}.${extensionFor(mimeType)}`)
  try {
    await File.downloadFileAsync(url, staged, { idempotent: true })
    output.create({ overwrite: true })
    const input = staged.open(FileMode.ReadOnly)
    const sink = output.open(FileMode.WriteOnly)
    try {
      const decryptor = createAssetDecryptor(dek)
      const total = staged.size ?? 0
      for (let read = 0; read < total; read += READ_BYTES) {
        const bytes = input.readBytes(Math.min(READ_BYTES, total - read))
        for (const chunk of decryptor.push(bytes)) sink.writeBytes(chunk)
      }
      sink.writeBytes(decryptor.finish())
    } finally {
      input.close()
      sink.close()
    }
    return output
  } catch (error) {
    if (output.exists) output.delete()
    throw error
  } finally {
    if (staged.exists) staged.delete()
  }
}

/** Delete one opened file. Safe on one already gone. */
export function discardOpened(file: File): void {
  if (file.exists) file.delete()
}

/** Empty `opened/`. Called at every launch; see the header. */
export function sweepOpenedFiles(): void {
  try {
    if (OPENED.exists) OPENED.delete()
  } catch {
    // Retried at the next launch; nothing else depends on it.
  }
}
