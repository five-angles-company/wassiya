import { describe, expect, it } from "vitest"

import { KEY_BYTES, randomBytes } from "./bytes"
import { generateDek } from "./keys"
import {
  buildReleaseBundle,
  generateHeirKey,
  openReleaseBundle,
} from "./heir"

function hexOf(map: Record<string, Uint8Array>): Record<string, number[]> {
  return Object.fromEntries(
    Object.entries(map).map(([id, key]) => [id, Array.from(key)])
  )
}

describe("release bundles", () => {
  it("round-trips DEKs and message keys through K_h", () => {
    const kH = generateHeirKey()
    const deks = { asset_a: generateDek(), asset_b: generateDek() }
    const messageKeys = { msg_1: generateDek() }

    const opened = openReleaseBundle(
      buildReleaseBundle(deks, messageKeys, kH),
      kH
    )
    expect(hexOf(opened.deks)).toEqual(hexOf(deks))
    expect(hexOf(opened.messageKeys)).toEqual(hexOf(messageKeys))
  })

  it("round-trips an empty bundle (an heir routed nothing yet)", () => {
    const kH = generateHeirKey()
    const opened = openReleaseBundle(buildReleaseBundle({}, {}, kH), kH)
    expect(opened.deks).toEqual({})
    expect(opened.messageKeys).toEqual({})
  })

  it("heir A's bundle cannot be opened with heir B's key", () => {
    const bundleA = buildReleaseBundle(
      { shared_asset: generateDek() },
      {},
      generateHeirKey()
    )
    expect(() => openReleaseBundle(bundleA, generateHeirKey())).toThrow()
  })

  it("detects a flipped byte in the bundle", () => {
    const kH = generateHeirKey()
    const bundle = buildReleaseBundle({ a: generateDek() }, {}, kH)
    for (let i = 0; i < bundle.length; i += 7) {
      const tampered = bundle.slice()
      tampered[i] = tampered[i]! ^ 0x01
      expect(() => openReleaseBundle(tampered, kH)).toThrow()
    }
  })

  it("gives every rebuild a fresh, unrelated K_h", () => {
    const a = generateHeirKey()
    const b = generateHeirKey()
    expect(a).toHaveLength(KEY_BYTES)
    expect(Array.from(a)).not.toEqual(Array.from(b))
  })

  it("rejects a non-32-byte key in the map", () => {
    expect(() =>
      buildReleaseBundle({ a: randomBytes(16) }, {}, generateHeirKey())
    ).toThrow(/32 bytes/)
  })
})
