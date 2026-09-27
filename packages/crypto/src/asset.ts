/**
 * Asset content encryption. Everything the owner uploads — files, photo
 * originals, thumbnails, note bodies — goes through here on the device before
 * a byte reaches Convex file storage.
 *
 * Chunked at 1 MiB so a large upload never has to be held in memory whole, and
 * so a viewer can decrypt the first chunk of a document without the rest. The
 * per-chunk primitives are exported for that streaming path; `encryptAsset` /
 * `decryptAsset` are the whole-buffer convenience over the same format.
 */
import { xchacha20poly1305 } from "@noble/ciphers/chacha.js"

import { TAG_BYTES, assertKey, concatBytes } from "./bytes"
import {
  DEFAULT_CHUNK_SIZE,
  HEADER_BYTES,
  type AssetHeader,
  chunkAad,
  chunkNonce,
  createAssetHeader,
  parseAssetHeader,
} from "./assetHeader"

export {
  DEFAULT_CHUNK_SIZE,
  createAssetHeader,
  parseAssetHeader,
  type AssetHeader,
} from "./assetHeader"

/** Encrypt one chunk in place in the stream. `index` must match its position. */
export function encryptChunk(
  dek: Uint8Array,
  header: AssetHeader,
  index: number,
  plaintext: Uint8Array
): Uint8Array {
  assertKey(dek, "dek")
  if (index < header.chunkCount - 1 && plaintext.length !== header.chunkSize) {
    throw new Error("Only the final chunk may be shorter than chunkSize")
  }
  if (plaintext.length > header.chunkSize) {
    throw new Error("Chunk is longer than chunkSize")
  }
  const nonce = chunkNonce(dek, header.salt, index)
  return xchacha20poly1305(dek, nonce, chunkAad(header, index)).encrypt(
    plaintext
  )
}

/** Decrypt one chunk. Throws if it was altered, reordered, or is the wrong one. */
export function decryptChunk(
  dek: Uint8Array,
  header: AssetHeader,
  index: number,
  ciphertext: Uint8Array
): Uint8Array {
  assertKey(dek, "dek")
  const nonce = chunkNonce(dek, header.salt, index)
  return xchacha20poly1305(dek, nonce, chunkAad(header, index)).decrypt(
    ciphertext
  )
}

/** Encrypt a whole buffer. Returns `header ‖ chunk₀ ‖ chunk₁ ‖ …`. */
export function encryptAsset(
  content: Uint8Array,
  dek: Uint8Array,
  chunkSize: number = DEFAULT_CHUNK_SIZE
): Uint8Array {
  assertKey(dek, "dek")
  const header = createAssetHeader(content.length, chunkSize)
  const parts: Uint8Array[] = [header.bytes]
  for (let index = 0; index < header.chunkCount; index++) {
    const start = index * header.chunkSize
    const plaintext = content.subarray(
      start,
      Math.min(start + header.chunkSize, content.length)
    )
    parts.push(encryptChunk(dek, header, index, plaintext))
  }
  return concatBytes(...parts)
}

/**
 * Decrypt a blob as it arrives, in pieces of any size — a download read off a
 * stream, so a long video is never held whole as ciphertext and plaintext at
 * once. `push` returns the plaintext chunks the bytes so far complete.
 *
 * The final chunk is the one whose length the header does not give, so it opens
 * only in `finish` — and `finish` throws unless exactly the framed asset
 * arrived. **A caller that skips `finish` accepts a truncated file:** a stream
 * cut short at a chunk boundary yields only valid chunks from `push`.
 */
export function createAssetDecryptor(dek: Uint8Array): {
  push: (bytes: Uint8Array) => Uint8Array[]
  finish: () => Uint8Array
} {
  assertKey(dek, "dek")
  const pending: Uint8Array[] = []
  let pendingBytes = 0
  let header: AssetHeader | null = null
  let index = 0

  const take = (length: number): Uint8Array => {
    const out = new Uint8Array(length)
    let offset = 0
    while (offset < length) {
      const head = pending[0] as Uint8Array
      const need = length - offset
      if (head.length <= need) {
        out.set(head, offset)
        offset += head.length
        pending.shift()
      } else {
        out.set(head.subarray(0, need), offset)
        pending[0] = head.subarray(need)
        offset += need
      }
    }
    pendingBytes -= length
    return out
  }

  return {
    push(bytes) {
      // A copy: a stream reader is free to reuse the buffer it handed over.
      pending.push(bytes.slice())
      pendingBytes += bytes.length
      if (header === null) {
        if (pendingBytes < HEADER_BYTES) return []
        header = parseAssetHeader(take(HEADER_BYTES))
      }
      const fullChunkBytes = header.chunkSize + TAG_BYTES
      const out: Uint8Array[] = []
      while (index < header.chunkCount - 1 && pendingBytes >= fullChunkBytes) {
        out.push(decryptChunk(dek, header, index, take(fullChunkBytes)))
        index++
      }
      return out
    },
    finish() {
      if (header === null || index !== header.chunkCount - 1) {
        throw new Error("Encrypted asset ended before its last chunk")
      }
      if (pendingBytes < TAG_BYTES || pendingBytes > header.chunkSize + TAG_BYTES) {
        throw new Error("Encrypted asset length does not match its header")
      }
      const last = decryptChunk(dek, header, index, take(pendingBytes))
      index++
      return last
    },
  }
}

/**
 * Reverse of {@link encryptAsset}. Throws on any modification, including one
 * that leaves every surviving chunk internally valid: `chunkCount` is inside
 * each chunk's AAD, so a truncated blob fails rather than decoding short.
 */
export function decryptAsset(blob: Uint8Array, dek: Uint8Array): Uint8Array {
  assertKey(dek, "dek")
  const header = parseAssetHeader(blob)
  const body = blob.subarray(HEADER_BYTES)

  const fullChunkBytes = header.chunkSize + TAG_BYTES
  const lastChunkBytes = body.length - (header.chunkCount - 1) * fullChunkBytes
  if (lastChunkBytes < TAG_BYTES || lastChunkBytes > fullChunkBytes) {
    throw new Error("Encrypted asset length does not match its header")
  }

  const parts: Uint8Array[] = []
  for (let index = 0; index < header.chunkCount; index++) {
    const start = index * fullChunkBytes
    const end =
      index === header.chunkCount - 1 ? body.length : start + fullChunkBytes
    parts.push(decryptChunk(dek, header, index, body.subarray(start, end)))
  }
  return concatBytes(...parts)
}
