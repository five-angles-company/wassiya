import { describe, expect, it } from "vitest"

import { KEY_BYTES, randomBytes, xor } from "./bytes"
import { generateMk } from "./keys"
import {
  recoverMk,
  rotateGuardianShare,
  rotatePaperShare,
  splitRecovery,
} from "./recovery"

describe("splitRecovery / recoverMk", () => {
  it("round-trips MK through both shares", () => {
    const mk = generateMk()
    const { sPaper, sGuardian, mkWrappedByRecovery } = splitRecovery(mk)
    expect(
      Array.from(recoverMk(sPaper, sGuardian, mkWrappedByRecovery))
    ).toEqual(Array.from(mk))
  })

  it("is useless with one share — the other half is not guessable", () => {
    const mk = generateMk()
    const { sPaper, sGuardian, mkWrappedByRecovery } = splitRecovery(mk)
    const zeros = new Uint8Array(KEY_BYTES)
    expect(() => recoverMk(sPaper, zeros, mkWrappedByRecovery)).toThrow()
    expect(() => recoverMk(zeros, sGuardian, mkWrappedByRecovery)).toThrow()
    expect(() =>
      recoverMk(sPaper, randomBytes(KEY_BYTES), mkWrappedByRecovery)
    ).toThrow()
  })

  it("does not encode MK in the shares themselves", () => {
    // The catastrophic implementation is `sGuardian = mk XOR sPaper`, which
    // hands MK to anyone holding either share. Assert the shares are unrelated
    // to MK: neither equals it, and neither is its XOR-complement.
    for (let i = 0; i < 32; i++) {
      const mk = generateMk()
      const { sPaper, sGuardian } = splitRecovery(mk)
      expect(Array.from(sPaper)).not.toEqual(Array.from(mk))
      expect(Array.from(sGuardian)).not.toEqual(Array.from(mk))
      expect(Array.from(xor(sPaper, sGuardian))).not.toEqual(Array.from(mk))
      expect(Array.from(xor(sPaper, mk))).not.toEqual(Array.from(sGuardian))
      expect(Array.from(xor(sGuardian, mk))).not.toEqual(Array.from(sPaper))
    }
  })

  it("re-splitting the same MK yields entirely fresh shares", () => {
    const mk = generateMk()
    const first = splitRecovery(mk)
    const second = splitRecovery(mk)
    expect(Array.from(first.sPaper)).not.toEqual(Array.from(second.sPaper))
    expect(Array.from(first.sGuardian)).not.toEqual(
      Array.from(second.sGuardian)
    )
  })

  it("produces uniformly distributed share bits", () => {
    // Each bit position across many shares should land near 50/50. With 2000
    // samples the standard deviation is ~1.1%, so the 40–60% window is ~9σ —
    // wide enough never to flake, tight enough to catch a constant or a
    // low-entropy source.
    const samples = 2000
    const ones = new Array<number>(KEY_BYTES * 8).fill(0)
    const mk = generateMk()
    for (let s = 0; s < samples; s++) {
      const { sGuardian } = splitRecovery(mk)
      for (let byte = 0; byte < KEY_BYTES; byte++) {
        for (let bit = 0; bit < 8; bit++) {
          if ((sGuardian[byte]! >>> bit) & 1) {
            ones[byte * 8 + bit]! += 1
          }
        }
      }
    }
    for (const count of ones) {
      expect(count / samples).toBeGreaterThan(0.4)
      expect(count / samples).toBeLessThan(0.6)
    }
  })
})

describe("rotation", () => {
  it("reprints the paper sheet and invalidates the old one", () => {
    const mk = generateMk()
    const original = splitRecovery(mk)
    const rotated = rotatePaperShare(mk, original.sGuardian)

    expect(
      Array.from(
        recoverMk(
          rotated.sPaper,
          original.sGuardian,
          rotated.mkWrappedByRecovery
        )
      )
    ).toEqual(Array.from(mk))
    expect(() =>
      recoverMk(
        original.sPaper,
        original.sGuardian,
        rotated.mkWrappedByRecovery
      )
    ).toThrow()
  })

  it("replaces the guardian and invalidates their old share", () => {
    const mk = generateMk()
    const original = splitRecovery(mk)
    const rotated = rotateGuardianShare(mk, original.sPaper)

    expect(
      Array.from(
        recoverMk(
          original.sPaper,
          rotated.sGuardian,
          rotated.mkWrappedByRecovery
        )
      )
    ).toEqual(Array.from(mk))
    expect(() =>
      recoverMk(
        original.sPaper,
        original.sGuardian,
        rotated.mkWrappedByRecovery
      )
    ).toThrow()
  })
})
