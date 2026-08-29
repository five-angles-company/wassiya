import { randomBytes } from "@noble/hashes/utils.js"
import { describe, expect, it } from "vitest"

import { KEY_BYTES } from "./bytes"
import { guardianPublicKey, openFromGuardian, sealToGuardian } from "./guardian"
import {
  GUARDIAN_SHEET_VERSION,
  decodeGuardianKey,
  encodeGuardianKey,
  guardianKeyMatches,
  mintGuardianKeySheet,
} from "./guardianKey"
import { encodePaperCode } from "./papercode"

describe("guardian key sheet", () => {
  it("round-trips the secret and its version", () => {
    const sheet = mintGuardianKeySheet()
    const decoded = decodeGuardianKey(sheet.code)
    expect([...decoded.secretKey]).toEqual([...sheet.secretKey])
    expect(decoded.version).toBe(GUARDIAN_SHEET_VERSION)
  })

  it("renders as WSYG<version> plus 14 groups of 4", () => {
    expect(mintGuardianKeySheet().code).toMatch(
      /^WSYG1(-[2-9A-HJ-NP-Z]{4}){14}$/
    )
  })

  it("publishes the public key the printed secret derives", () => {
    const sheet = mintGuardianKeySheet()
    const fromCode = guardianPublicKey(decodeGuardianKey(sheet.code).secretKey)
    expect([...fromCode]).toEqual([...sheet.publicKey])
  })

  /**
   * The point of the whole sheet: what the owner sealed, this opens. If this
   * test ever fails, every heir bundle sealed to that guardian is unopenable.
   */
  it("opens a share the owner sealed to the published key", () => {
    const sheet = mintGuardianKeySheet()
    const share = randomBytes(KEY_BYTES)
    const sealed = sealToGuardian(share, sheet.publicKey)

    const recovered = openFromGuardian(
      sealed,
      decodeGuardianKey(sheet.code).secretKey
    )
    expect([...recovered]).toEqual([...share])
  })

  it("forgives spacing and case", () => {
    const sheet = mintGuardianKeySheet()
    const typed = sheet.code.toLowerCase().replace(/-/g, " ")
    expect([...decodeGuardianKey(typed).secretKey]).toEqual([
      ...sheet.secretKey,
    ])
  })

  it("catches every single-character typo", () => {
    const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    const body = mintGuardianKeySheet().code.split("-").slice(1).join("")
    let checked = 0

    for (let i = 0; i < body.length; i++) {
      for (const glyph of alphabet) {
        if (glyph === body[i]) continue
        const mutated = body.slice(0, i) + glyph + body.slice(i + 1)
        expect(() => decodeGuardianKey(`WSYG1-${mutated}`)).toThrow()
        checked++
      }
    }
    expect(checked).toBe(56 * 31)
  })

  /**
   * The domain separation, which is the reason the prefix alone was not enough:
   * both sheets carry 32 bytes in the same alphabet at the same length, so
   * without a domain inside the checksum a recovery sheet would decode here as
   * a perfectly valid guardian key.
   */
  it("rejects the owner's recovery sheet", () => {
    const secret = randomBytes(KEY_BYTES)
    const recovery = encodePaperCode(secret, 1)

    // Even relabelled to look like a guardian code, the checksum was computed
    // over a different domain and cannot pass.
    const relabelled = `WSYG${recovery.slice(3)}`
    expect(() => decodeGuardianKey(relabelled)).toThrow(/checksum/)
    expect(() => decodeGuardianKey(recovery)).toThrow(/must start with WSYG/)
  })

  it("rejects a short secret and an out-of-range version", () => {
    expect(() => encodeGuardianKey(randomBytes(16))).toThrow(/32 bytes/)
    expect(() => encodeGuardianKey(randomBytes(KEY_BYTES), 0)).toThrow(
      /version/
    )
  })

  describe("guardianKeyMatches", () => {
    it("accepts the sheet that derives the published key", () => {
      const sheet = mintGuardianKeySheet()
      expect(guardianKeyMatches(sheet.code, sheet.publicKey)).toBe(true)
    })

    it("rejects another guardian's sheet", () => {
      const mine = mintGuardianKeySheet()
      const theirs = mintGuardianKeySheet()
      expect(guardianKeyMatches(theirs.code, mine.publicKey)).toBe(false)
    })

    it("answers false rather than throwing on an unreadable code", () => {
      const sheet = mintGuardianKeySheet()
      expect(guardianKeyMatches("not a code", sheet.publicKey)).toBe(false)
      expect(guardianKeyMatches("", sheet.publicKey)).toBe(false)
    })
  })
})
