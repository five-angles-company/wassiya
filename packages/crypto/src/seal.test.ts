import { describe, expect, it } from "vitest"

import { KEY_BYTES, randomBytes } from "./bytes"
import { generateSealKeypair, openSealedKey, sealKeyTo } from "./seal"

describe("sealKeyTo / openSealedKey", () => {
  it("round-trips a key to the recipient", () => {
    const recipient = generateSealKeypair()
    const key = randomBytes(KEY_BYTES)
    const sealed = sealKeyTo(key, recipient.publicKey)
    expect(Array.from(openSealedKey(sealed, recipient.secretKey))).toEqual(
      Array.from(key)
    )
  })

  it("cannot be opened by another key", () => {
    const sealed = sealKeyTo(randomBytes(KEY_BYTES), generateSealKeypair().publicKey)
    expect(() => openSealedKey(sealed, generateSealKeypair().secretKey)).toThrow()
  })

  it("rejects any altered byte", () => {
    const recipient = generateSealKeypair()
    const sealed = sealKeyTo(randomBytes(KEY_BYTES), recipient.publicKey)
    const last = sealed.length - 1
    sealed[last] = (sealed[last] ?? 0) ^ 1
    expect(() => openSealedKey(sealed, recipient.secretKey)).toThrow()
  })
})
