import { describe, expect, it } from "vitest"

import { randomBytes, utf8ToBytes } from "./bytes"
import { generateDek, generateMk } from "./keys"
import { LABEL_AAD, openLabel, sealLabel } from "./label"
import { open, seal } from "./wrap"

describe("asset labels", () => {
  it("round-trips Arabic, Latin and mixed text", () => {
    const dek = generateDek()
    for (const label of [
      { title: "محفظة Ledger الرئيسية", subtitle: "عبارة سرّية · Bitcoin" },
      { title: "مصرف الراجحي", subtitle: "SA44 •••• •••• 8901 2345" },
      { title: "iCloud · fatima@icloud.com" },
    ]) {
      expect(openLabel(sealLabel(label, dek), dek)).toEqual(label)
    }
  })

  it("treats an omitted subtitle and an undefined one as the same label", () => {
    const dek = generateDek()
    const omitted = sealLabel({ title: "صور العائلة" }, dek)
    const explicit = sealLabel({ title: "صور العائلة", subtitle: undefined }, dek)
    expect(openLabel(omitted, dek)).toEqual({ title: "صور العائلة" })
    expect(openLabel(explicit, dek)).toEqual({ title: "صور العائلة" })
  })

  it("uses a fresh nonce, so the same label seals to different ciphertext", () => {
    const dek = generateDek()
    const label = { title: "صك ملكية — حطين" }
    expect(Array.from(sealLabel(label, dek))).not.toEqual(
      Array.from(sealLabel(label, dek))
    )
  })

  it("rejects the wrong key — including MK, which must never open a label", () => {
    const dek = generateDek()
    const sealed = sealLabel({ title: "صور العائلة" }, dek)
    expect(() => openLabel(sealed, generateDek())).toThrow()
    expect(() => openLabel(sealed, generateMk())).toThrow()
  })

  it("detects a single flipped byte anywhere in the envelope", () => {
    const dek = generateDek()
    const sealed = sealLabel({ title: "صك ملكية — حطين" }, dek)
    for (let i = 0; i < sealed.length; i++) {
      const tampered = sealed.slice()
      tampered[i]! ^= 0x01
      expect(() => openLabel(tampered, dek)).toThrow()
    }
  })

  it("is domain-separated: the same bytes sealed without the label AAD do not open", () => {
    const dek = generateDek()
    const plaintext = utf8ToBytes(JSON.stringify({ title: "صور العائلة" }))
    // Correct key, correct plaintext, wrong domain — the tag must still fail,
    // so a ciphertext from another part of the package cannot be replayed here.
    expect(() => openLabel(seal(dek, plaintext), dek)).toThrow()
    expect(() =>
      open(sealLabel({ title: "صور العائلة" }, dek), dek)
    ).toThrow()
  })

  it("refuses an empty title and an oversized label", () => {
    const dek = generateDek()
    expect(() => sealLabel({ title: "" }, dek)).toThrow(/needs a title/)
    expect(() =>
      sealLabel({ title: "x", subtitle: "ن".repeat(4096) }, dek)
    ).toThrow(/may not exceed/)
  })

  it("rejects a non-32-byte key on both sides", () => {
    const short = randomBytes(16)
    expect(() => sealLabel({ title: "x" }, short)).toThrow()
    const sealed = sealLabel({ title: "x" }, generateDek())
    expect(() => openLabel(sealed, short)).toThrow()
  })

  it("declares its version in the AAD, so a format change cannot parse as v1", () => {
    expect(new TextDecoder().decode(LABEL_AAD)).toBe("wassiya/asset-label/v1")
  })
})
