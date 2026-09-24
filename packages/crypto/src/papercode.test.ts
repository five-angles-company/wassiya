import { describe, expect, it } from "vitest"

import { KEY_BYTES, randomBytes } from "./bytes"
import {
  decodePaperCode,
  encodePaperCode,
  looksLikeRecoveryCode,
} from "./papercode"

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

describe("paper code", () => {
  it("round-trips the share and its version", () => {
    const sPaper = randomBytes(KEY_BYTES)
    const decoded = decodePaperCode(encodePaperCode(sPaper, 3))
    expect(Array.from(decoded.sPaper)).toEqual(Array.from(sPaper))
    expect(decoded.version).toBe(3)
  })

  it("renders as WSY<version> plus 14 groups of 4", () => {
    const code = encodePaperCode(randomBytes(KEY_BYTES), 1)
    expect(code).toMatch(/^WSY1(-[2-9A-HJ-NP-Z]{4}){14}$/)
  })

  it("uses no ambiguous glyphs", () => {
    for (let i = 0; i < 64; i++) {
      const body = encodePaperCode(randomBytes(KEY_BYTES), 1).slice(5)
      expect(body).not.toMatch(/[01IO]/)
    }
  })

  it("forgives spacing and case", () => {
    const sPaper = randomBytes(KEY_BYTES)
    const code = encodePaperCode(sPaper, 1)
    const messy = code.toLowerCase().replace(/-/g, " ")
    expect(Array.from(decodePaperCode(messy).sPaper)).toEqual(
      Array.from(sPaper)
    )
  })

  it("catches every single-character typo", () => {
    // CRC-16/CCITT detects all bursts up to 16 bits; a one-character change
    // perturbs at most a 13-bit burst. So this is exhaustive, not sampled:
    // every position × every other alphabet symbol must be rejected.
    const code = encodePaperCode(randomBytes(KEY_BYTES), 1)
    const compact = code.replace(/-/g, "")
    let checked = 0
    for (let i = 4; i < compact.length; i++) {
      for (const replacement of ALPHABET) {
        if (replacement === compact[i]) {
          continue
        }
        const typo = compact.slice(0, i) + replacement + compact.slice(i + 1)
        expect(() => decodePaperCode(typo)).toThrow()
        checked += 1
      }
    }
    expect(checked).toBe(56 * 31)
  })

  it("catches a transposition of two adjacent characters", () => {
    const code = encodePaperCode(randomBytes(KEY_BYTES), 1).replace(/-/g, "")
    let caught = 0
    let attempted = 0
    for (let i = 4; i < code.length - 1; i++) {
      if (code[i] === code[i + 1]) {
        continue
      }
      attempted += 1
      const swapped =
        code.slice(0, i) + code[i + 1]! + code[i]! + code.slice(i + 2)
      try {
        decodePaperCode(swapped)
      } catch {
        caught += 1
      }
    }
    expect(caught).toBe(attempted)
  })

  it("rejects a wrong prefix, a wrong length, and an unusable character", () => {
    const code = encodePaperCode(randomBytes(KEY_BYTES), 1)
    expect(() => decodePaperCode(code.replace("WSY", "XYZ"))).toThrow(/WSY/)
    expect(() => decodePaperCode(code.slice(0, code.length - 1))).toThrow()
    // Swap a character in the body (not the WSY1 prefix) for an excluded glyph.
    const withBadGlyph = `${code.slice(0, 5)}I${code.slice(6)}`
    expect(() => decodePaperCode(withBadGlyph)).toThrow(/unusable character/)
  })

  it("rejects a version that disagrees with the prefix", () => {
    const code = encodePaperCode(randomBytes(KEY_BYTES), 1)
    expect(() => decodePaperCode(`WSY2${code.slice(4)}`)).toThrow()
  })

  it("rejects an out-of-range version and a short share", () => {
    expect(() => encodePaperCode(randomBytes(KEY_BYTES), 0)).toThrow(/version/)
    expect(() => encodePaperCode(randomBytes(16), 1)).toThrow(/32 bytes/)
  })
})

describe("looksLikeRecoveryCode", () => {
  it("a real code, with or without its prefix", () => {
    const code = encodePaperCode(new Uint8Array(32).fill(7), 1)
    expect(looksLikeRecoveryCode(`my code is ${code}`)).toBe(true)
    expect(looksLikeRecoveryCode(code.split("-").slice(1).join(" "))).toBe(true)
  })

  it("ordinary text", () => {
    expect(looksLikeRecoveryCode("this will make some very good tree when done")).toBe(false)
    expect(looksLikeRecoveryCode("رقم الطلب 12345")).toBe(false)
  })
})
