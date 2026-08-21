import { describe, expect, it } from "vitest"

import { KEY_BYTES, randomBytes, utf8ToBytes } from "./bytes"
import { generateDek, generateMk } from "./keys"
import { open, seal, unwrap, wrap } from "./wrap"

describe("key generation", () => {
  it("produces distinct 256-bit keys", () => {
    const a = generateMk()
    const b = generateMk()
    expect(a).toHaveLength(KEY_BYTES)
    expect(generateDek()).toHaveLength(KEY_BYTES)
    expect(Array.from(a)).not.toEqual(Array.from(b))
  })
})

describe("wrap / unwrap", () => {
  it("round-trips a key", () => {
    const mk = generateMk()
    const kek = randomBytes(KEY_BYTES)
    expect(Array.from(unwrap(wrap(mk, kek), kek))).toEqual(Array.from(mk))
  })

  it("uses a fresh nonce, so the same key wraps to different ciphertext", () => {
    const mk = generateMk()
    const kek = randomBytes(KEY_BYTES)
    expect(Array.from(wrap(mk, kek))).not.toEqual(Array.from(wrap(mk, kek)))
  })

  it("rejects the wrong KEK", () => {
    const wrapped = wrap(generateMk(), randomBytes(KEY_BYTES))
    expect(() => unwrap(wrapped, randomBytes(KEY_BYTES))).toThrow()
  })

  it("detects a single flipped byte anywhere in the wrapper", () => {
    const mk = generateMk()
    const kek = randomBytes(KEY_BYTES)
    const wrapped = wrap(mk, kek)
    for (let i = 0; i < wrapped.length; i++) {
      const tampered = wrapped.slice()
      tampered[i] = tampered[i]! ^ 0x01
      expect(() => unwrap(tampered, kek)).toThrow()
    }
  })

  it("rejects a truncated wrapper", () => {
    const wrapped = wrap(generateMk(), randomBytes(KEY_BYTES))
    expect(() =>
      unwrap(wrapped.slice(0, wrapped.length - 1), randomBytes(KEY_BYTES))
    ).toThrow()
  })

  it("rejects a non-32-byte key or KEK", () => {
    expect(() => wrap(randomBytes(16), randomBytes(KEY_BYTES))).toThrow(
      /32 bytes/
    )
    expect(() => wrap(generateMk(), randomBytes(16))).toThrow(/32 bytes/)
  })
})

describe("seal / open", () => {
  it("round-trips arbitrary plaintext with AAD", () => {
    const key = randomBytes(KEY_BYTES)
    const aad = utf8ToBytes("context")
    const message = utf8ToBytes("وصيّة")
    expect(Array.from(open(seal(key, message, aad), key, aad))).toEqual(
      Array.from(message)
    )
  })

  it("rejects a mismatched AAD", () => {
    const key = randomBytes(KEY_BYTES)
    const boxed = seal(key, utf8ToBytes("hello"), utf8ToBytes("context-a"))
    expect(() => open(boxed, key, utf8ToBytes("context-b"))).toThrow()
  })

  it("never leaks key bytes through an error message", () => {
    const key = randomBytes(KEY_BYTES)
    try {
      open(seal(key, utf8ToBytes("x")), randomBytes(KEY_BYTES))
      expect.unreachable("should have thrown")
    } catch (error) {
      expect(String(error)).not.toMatch(/[0-9a-f]{32,}/i)
    }
  })
})
