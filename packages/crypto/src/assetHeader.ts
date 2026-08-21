/**
 * The framing of an encrypted asset blob.
 *
 *   header(29) ‖ chunk₀ ‖ chunk₁ ‖ …
 *   header = "WSYA"(4) ‖ version(1) ‖ chunkSize(4) ‖ chunkCount(4) ‖ salt(16)
 *
 * Two decisions in here carry the security weight:
 *
 * 1. **The salt is fresh per encryption.** Chunk nonces are derived, not
 *    random, so a second encryption of a *different* plaintext under the *same*
 *    DEK would otherwise reuse every nonce — the one failure mode that breaks
 *    XChaCha completely. The random salt makes each encryption's nonce stream
 *    unique even when the DEK is deliberately reused.
 *
 * 2. **The whole header is the AAD of every chunk.** That binds `chunkCount`
 *    into each chunk's tag, so dropping trailing chunks is detected. Per-chunk
 *    tags alone would not catch it: each surviving chunk still verifies.
 */
import { sha256 } from "@noble/hashes/sha2.js"
import { hkdf } from "@noble/hashes/hkdf.js"

import {
  NONCE_BYTES,
  assertKey,
  assertNonNegativeInt,
  concatBytes,
  equalBytes,
  randomBytes,
  readUint32BE,
  uint32BE,
  utf8ToBytes,
} from "./bytes"

/** 1 MiB: large enough that per-chunk overhead is noise, small enough to stream. */
export const DEFAULT_CHUNK_SIZE = 1024 * 1024

export const ASSET_MAGIC = utf8ToBytes("WSYA")
export const ASSET_VERSION = 1
export const SALT_BYTES = 16
export const HEADER_BYTES = 4 + 1 + 4 + 4 + SALT_BYTES

const CHUNK_INFO = utf8ToBytes("wassiya/asset-chunk/v1")

export type AssetHeader = {
  /** The serialised header, which is also the AAD prefix for every chunk. */
  bytes: Uint8Array
  chunkSize: number
  chunkCount: number
  salt: Uint8Array
}

/**
 * Build a header for a payload of `totalBytes`. An empty payload still gets one
 * (empty) chunk, so the header is always covered by at least one tag.
 */
export function createAssetHeader(
  totalBytes: number,
  chunkSize: number = DEFAULT_CHUNK_SIZE
): AssetHeader {
  assertNonNegativeInt(totalBytes, "totalBytes")
  if (!Number.isSafeInteger(chunkSize) || chunkSize <= 0) {
    throw new Error("chunkSize must be a positive integer")
  }
  const chunkCount = Math.max(1, Math.ceil(totalBytes / chunkSize))
  if (chunkCount > 0xffffffff) {
    throw new Error("Asset is too large to frame")
  }
  const salt = randomBytes(SALT_BYTES)
  return {
    bytes: concatBytes(
      ASSET_MAGIC,
      new Uint8Array([ASSET_VERSION]),
      uint32BE(chunkSize),
      uint32BE(chunkCount),
      salt
    ),
    chunkSize,
    chunkCount,
    salt,
  }
}

/** Read a header off the front of a blob. Rejects anything it does not know. */
export function parseAssetHeader(blob: Uint8Array): AssetHeader {
  if (blob.length < HEADER_BYTES) {
    throw new Error("Encrypted asset is shorter than its header")
  }
  const bytes = blob.slice(0, HEADER_BYTES)
  if (!equalBytes(bytes.subarray(0, 4), ASSET_MAGIC)) {
    throw new Error("Not a Wassiya encrypted asset")
  }
  if (bytes[4] !== ASSET_VERSION) {
    throw new Error(`Unsupported encrypted asset version ${bytes[4]}`)
  }
  const chunkSize = readUint32BE(bytes, 5)
  const chunkCount = readUint32BE(bytes, 9)
  if (chunkSize === 0 || chunkCount === 0) {
    throw new Error("Encrypted asset header is malformed")
  }
  return {
    bytes,
    chunkSize,
    chunkCount,
    salt: bytes.slice(13, 13 + SALT_BYTES),
  }
}

/**
 * Nonce for chunk `index`: HKDF over the DEK, salted with this encryption's
 * random salt and separated by the chunk index. Deterministic, so a streaming
 * reader can jump straight to any chunk without replaying the ones before it.
 */
export function chunkNonce(
  dek: Uint8Array,
  salt: Uint8Array,
  index: number
): Uint8Array {
  assertKey(dek, "dek")
  assertNonNegativeInt(index, "index")
  return hkdf(
    sha256,
    dek,
    salt,
    concatBytes(CHUNK_INFO, uint32BE(index)),
    NONCE_BYTES
  )
}

/** AAD for chunk `index`: the full header plus the index. */
export function chunkAad(header: AssetHeader, index: number): Uint8Array {
  assertNonNegativeInt(index, "index")
  if (index >= header.chunkCount) {
    throw new Error("Chunk index is outside the framed asset")
  }
  return concatBytes(header.bytes, uint32BE(index))
}
