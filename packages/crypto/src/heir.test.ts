import { describe, expect, it } from "vitest"

import { KEY_BYTES, randomBytes } from "./bytes"
import { generateDek } from "./keys"
import {
  buildReleaseBundle,
  heirKey,
  makeHeirShares,
  openReleaseBundle,
} from "./heir"

function hexOf(map: Record<string, Uint8Array>): Record<string, number[]> {
  return Object.fromEntries(
    Object.entries(map).map(([id, key]) => [id, Array.from(key)])
  )
}

describe("release bundles", () => {
  it("round-trips DEKs and message keys through K_h", () => {
    const shares = makeHeirShares()
    const kH = heirKey(shares.sServer, shares.sGuardian)
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
    const shares = makeHeirShares()
    const kH = heirKey(shares.sServer, shares.sGuardian)
    const opened = openReleaseBundle(buildReleaseBundle({}, {}, kH), kH)
    expect(opened.deks).toEqual({})
    expect(opened.messageKeys).toEqual({})
  })

  it("cannot be opened with only the server share", () => {
    const shares = makeHeirShares()
    const kH = heirKey(shares.sServer, shares.sGuardian)
    const bundle = buildReleaseBundle({ a: generateDek() }, {}, kH)
    expect(() => openReleaseBundle(bundle, shares.sServer)).toThrow()
    expect(() => openReleaseBundle(bundle, shares.sGuardian)).toThrow()
  })

  it("heir A's bundle cannot be opened with heir B's keys", () => {
    const a = makeHeirShares()
    const b = makeHeirShares()
    const bundleA = buildReleaseBundle(
      { shared_asset: generateDek() },
      {},
      heirKey(a.sServer, a.sGuardian)
    )
    expect(() =>
      openReleaseBundle(bundleA, heirKey(b.sServer, b.sGuardian))
    ).toThrow()
    // Nor by mixing halves — the server half of A with the guardian half of B.
    expect(() =>
      openReleaseBundle(bundleA, heirKey(a.sServer, b.sGuardian))
    ).toThrow()
  })

  it("detects a flipped byte in the bundle", () => {
    const shares = makeHeirShares()
    const kH = heirKey(shares.sServer, shares.sGuardian)
    const bundle = buildReleaseBundle({ a: generateDek() }, {}, kH)
    for (let i = 0; i < bundle.length; i += 7) {
      const tampered = bundle.slice()
      tampered[i] = tampered[i]! ^ 0x01
      expect(() => openReleaseBundle(tampered, kH)).toThrow()
    }
  })

  it("gives every heir a fresh, unrelated pair of shares", () => {
    const a = makeHeirShares()
    const b = makeHeirShares()
    expect(Array.from(a.sServer)).not.toEqual(Array.from(b.sServer))
    expect(Array.from(a.sGuardian)).not.toEqual(Array.from(b.sGuardian))
    expect(a.sServer).toHaveLength(KEY_BYTES)
    expect(a.sGuardian).toHaveLength(KEY_BYTES)
  })

  it("rejects a non-32-byte key in the map", () => {
    const shares = makeHeirShares()
    const kH = heirKey(shares.sServer, shares.sGuardian)
    expect(() => buildReleaseBundle({ a: randomBytes(16) }, {}, kH)).toThrow(
      /32 bytes/
    )
  })
})
