import { describe, expect, it } from "vitest"

import { KEY_BYTES, randomBytes } from "./bytes"
import { generateMk } from "./keys"
import { recoverMk, rotatePaperShare, splitRecovery } from "./recovery"
import { wrap } from "./wrap"

const USER = "j5701abcdefghijklmnopqrstuv"
const OTHER_USER = "j5702zyxwvutsrqponmlkjihgfe"

describe("splitRecovery / recoverMk", () => {
  it("round-trips MK through the paper share alone", () => {
    const mk = generateMk()
    const { sPaper, mkWrappedByRecovery } = splitRecovery(mk, USER, 1)
    expect(
      Array.from(recoverMk(sPaper, mkWrappedByRecovery, USER, 1))
    ).toEqual(Array.from(mk))
  })

  it("is useless without the paper share", () => {
    const mk = generateMk()
    const { mkWrappedByRecovery } = splitRecovery(mk, USER, 1)
    const zeros = new Uint8Array(KEY_BYTES)
    expect(() => recoverMk(zeros, mkWrappedByRecovery, USER, 1)).toThrow()
    expect(() =>
      recoverMk(randomBytes(KEY_BYTES), mkWrappedByRecovery, USER, 1)
    ).toThrow()
  })

  it("does not encode MK in the share itself", () => {
    // The catastrophic implementation hands MK to anyone holding the share.
    for (let i = 0; i < 32; i++) {
      const mk = generateMk()
      const { sPaper } = splitRecovery(mk, USER, 1)
      expect(Array.from(sPaper)).not.toEqual(Array.from(mk))
    }
  })

  it("re-splitting the same MK yields an entirely fresh share", () => {
    const mk = generateMk()
    const first = splitRecovery(mk, USER, 1)
    const second = splitRecovery(mk, USER, 1)
    expect(Array.from(first.sPaper)).not.toEqual(Array.from(second.sPaper))
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
      const { sPaper } = splitRecovery(mk, USER, 1)
      for (let byte = 0; byte < KEY_BYTES; byte++) {
        for (let bit = 0; bit < 8; bit++) {
          if ((sPaper[byte]! >>> bit) & 1) {
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

/**
 * The sheet is the only factor now, so a stolen wrapper must not be portable.
 * These are the tests that make the AAD real rather than decorative.
 */
describe("the wrapper is bound to one owner and one sheet generation", () => {
  it("refuses a wrapper built for a different account", () => {
    const mk = generateMk()
    const { sPaper, mkWrappedByRecovery } = splitRecovery(mk, USER, 1)
    expect(() =>
      recoverMk(sPaper, mkWrappedByRecovery, OTHER_USER, 1)
    ).toThrow()
  })

  it("refuses a wrapper built for a different paper version", () => {
    const mk = generateMk()
    const { sPaper, mkWrappedByRecovery } = splitRecovery(mk, USER, 3)
    expect(() => recoverMk(sPaper, mkWrappedByRecovery, USER, 2)).toThrow()
    expect(() => recoverMk(sPaper, mkWrappedByRecovery, USER, 4)).toThrow()
    expect(
      Array.from(recoverMk(sPaper, mkWrappedByRecovery, USER, 3))
    ).toEqual(Array.from(mk))
  })

  it("refuses a v1 wrapper, which carried no AAD at all", () => {
    // A pre-change wrapper needed two shares, so it could never be opened here
    // anyway. This asserts it fails closed rather than opening under whichever
    // single share happens to be passed.
    const mk = generateMk()
    const sPaper = randomBytes(KEY_BYTES)
    const v1 = wrap(mk, sPaper)
    expect(() => recoverMk(sPaper, v1, USER, 1)).toThrow()
  })
})

describe("rotation", () => {
  it("reprints the sheet and invalidates the old one", () => {
    const mk = generateMk()
    const original = splitRecovery(mk, USER, 1)
    const rotated = rotatePaperShare(mk, USER, 2)

    expect(
      Array.from(recoverMk(rotated.sPaper, rotated.mkWrappedByRecovery, USER, 2))
    ).toEqual(Array.from(mk))
    expect(() =>
      recoverMk(original.sPaper, rotated.mkWrappedByRecovery, USER, 2)
    ).toThrow()
  })

  it("leaves the old wrapper working until the new one is saved", () => {
    // The mint-then-save ordering is what stops a reprint that the owner
    // abandons half-way from destroying the vault. Rotating produces material;
    // it does not reach back and spoil what is already stored.
    const mk = generateMk()
    const original = splitRecovery(mk, USER, 1)
    rotatePaperShare(mk, USER, 2)
    expect(
      Array.from(
        recoverMk(original.sPaper, original.mkWrappedByRecovery, USER, 1)
      )
    ).toEqual(Array.from(mk))
  })
})
