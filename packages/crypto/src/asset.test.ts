import { describe, expect, it } from "vitest"

import { TAG_BYTES, randomBytes } from "./bytes"
import { generateDek } from "./keys"
import {
  createAssetHeader,
  decryptAsset,
  decryptChunk,
  encryptAsset,
  encryptChunk,
  parseAssetHeader,
} from "./asset"
import { HEADER_BYTES } from "./assetHeader"

const CHUNK = 64

describe("encryptAsset / decryptAsset", () => {
  it.each([0, 1, CHUNK - 1, CHUNK, CHUNK + 1, CHUNK * 3, CHUNK * 3 + 7])(
    "round-trips %i bytes",
    (size) => {
      const dek = generateDek()
      const content = randomBytes(size)
      const decrypted = decryptAsset(encryptAsset(content, dek, CHUNK), dek)
      expect(Array.from(decrypted)).toEqual(Array.from(content))
    }
  )

  it("round-trips at the real 1 MiB chunk size", () => {
    const dek = generateDek()
    const content = randomBytes(1024 * 1024 + 4096)
    const decrypted = decryptAsset(encryptAsset(content, dek), dek)
    expect(decrypted).toHaveLength(content.length)
    expect(Array.from(decrypted.subarray(0, 64))).toEqual(
      Array.from(content.subarray(0, 64))
    )
    expect(Array.from(decrypted.subarray(-64))).toEqual(
      Array.from(content.subarray(-64))
    )
  })

  it("rejects the wrong DEK", () => {
    const blob = encryptAsset(randomBytes(200), generateDek(), CHUNK)
    expect(() => decryptAsset(blob, generateDek())).toThrow()
  })

  it("produces different ciphertext for the same content and DEK", () => {
    // A fresh per-encryption salt drives the derived chunk nonces, so
    // re-encrypting under the same DEK never repeats a nonce.
    const dek = generateDek()
    const content = randomBytes(200)
    expect(Array.from(encryptAsset(content, dek, CHUNK))).not.toEqual(
      Array.from(encryptAsset(content, dek, CHUNK))
    )
  })

  it("detects a flipped byte in the header or in any chunk", () => {
    const dek = generateDek()
    const blob = encryptAsset(randomBytes(CHUNK * 2 + 5), dek, CHUNK)
    for (let i = 0; i < blob.length; i += 11) {
      const tampered = blob.slice()
      tampered[i] = tampered[i]! ^ 0x01
      expect(() => decryptAsset(tampered, dek)).toThrow()
    }
  })

  it("detects dropped trailing chunks", () => {
    // Each chunk carries its own tag, so a truncated blob's surviving chunks
    // all still verify. What catches it is chunkCount living in every chunk's
    // AAD: the header cannot be rewritten to match the shorter body.
    const dek = generateDek()
    const blob = encryptAsset(randomBytes(CHUNK * 4), dek, CHUNK)
    const truncated = blob.slice(0, blob.length - (CHUNK + TAG_BYTES))
    expect(() => decryptAsset(truncated, dek)).toThrow()

    // …and the header cannot be edited to declare the shorter count either.
    const forged = truncated.slice()
    forged[12] = 3
    expect(() => decryptAsset(forged, dek)).toThrow()
  })

  it("detects reordered chunks", () => {
    const dek = generateDek()
    const blob = encryptAsset(randomBytes(CHUNK * 3), dek, CHUNK)
    const stride = CHUNK + TAG_BYTES
    const swapped = blob.slice()
    const first = blob.slice(HEADER_BYTES, HEADER_BYTES + stride)
    const second = blob.slice(HEADER_BYTES + stride, HEADER_BYTES + stride * 2)
    swapped.set(second, HEADER_BYTES)
    swapped.set(first, HEADER_BYTES + stride)
    expect(() => decryptAsset(swapped, dek)).toThrow()
  })

  it("rejects a blob whose length disagrees with its header", () => {
    const dek = generateDek()
    const blob = encryptAsset(randomBytes(CHUNK * 2), dek, CHUNK)
    expect(() => decryptAsset(blob.slice(0, HEADER_BYTES + 4), dek)).toThrow(
      /does not match its header/
    )
  })

  it("rejects a foreign blob", () => {
    expect(() => decryptAsset(randomBytes(200), generateDek())).toThrow(
      /Not a Wassiya encrypted asset/
    )
    expect(() => decryptAsset(randomBytes(4), generateDek())).toThrow(
      /shorter than its header/
    )
  })
})

describe("streaming primitives", () => {
  it("encrypts and decrypts chunk by chunk without the whole buffer", () => {
    const dek = generateDek()
    const content = randomBytes(CHUNK * 2 + 9)
    const header = createAssetHeader(content.length, CHUNK)
    expect(header.chunkCount).toBe(3)

    const chunks: Uint8Array[] = []
    for (let i = 0; i < header.chunkCount; i++) {
      const start = i * CHUNK
      chunks.push(
        encryptChunk(
          dek,
          header,
          i,
          content.subarray(start, Math.min(start + CHUNK, content.length))
        )
      )
    }

    const parsed = parseAssetHeader(header.bytes)
    expect(parsed.chunkCount).toBe(header.chunkCount)
    expect(parsed.chunkSize).toBe(CHUNK)

    // Random access: chunk 2 decrypts without touching chunks 0 and 1.
    expect(Array.from(decryptChunk(dek, parsed, 2, chunks[2]!))).toEqual(
      Array.from(content.subarray(CHUNK * 2))
    )
  })

  it("refuses to decrypt a chunk at the wrong index", () => {
    const dek = generateDek()
    const header = createAssetHeader(CHUNK * 2, CHUNK)
    const chunk = encryptChunk(dek, header, 0, randomBytes(CHUNK))
    expect(() => decryptChunk(dek, header, 1, chunk)).toThrow()
  })

  it("refuses a short non-final chunk", () => {
    const dek = generateDek()
    const header = createAssetHeader(CHUNK * 2, CHUNK)
    expect(() => encryptChunk(dek, header, 0, randomBytes(CHUNK - 1))).toThrow(
      /final chunk/
    )
  })
})
