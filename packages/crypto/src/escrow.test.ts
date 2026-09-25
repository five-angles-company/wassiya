import { describe, expect, it } from "vitest"

import { bytesToHex } from "./bytes"
import { openFromEscrow, parseEscrowKey, sealForEscrow } from "./escrow"
import { generateDek } from "./keys"
import { generateSealKeypair } from "./seal"

const escrow = generateSealKeypair()
const asset = { ownerId: "owner_1", assetId: "asset_1" }

describe("escrow lock", () => {
  it("round-trips a DEK for the item it was sealed for", () => {
    const dek = generateDek()
    const sealed = sealForEscrow(dek, escrow.publicKey, asset)
    expect(Array.from(openFromEscrow(sealed, escrow.secretKey, asset))).toEqual(
      Array.from(dek)
    )
  })

  it("refuses a key copied onto another asset", () => {
    const sealed = sealForEscrow(generateDek(), escrow.publicKey, asset)
    expect(() =>
      openFromEscrow(sealed, escrow.secretKey, { ...asset, assetId: "asset_2" })
    ).toThrow()
  })

  it("refuses a key copied onto another owner", () => {
    const sealed = sealForEscrow(generateDek(), escrow.publicKey, asset)
    expect(() =>
      openFromEscrow(sealed, escrow.secretKey, { ...asset, ownerId: "owner_2" })
    ).toThrow()
  })

  it("keeps an asset key and a message key apart even with equal ids", () => {
    const sealed = sealForEscrow(generateDek(), escrow.publicKey, asset)
    expect(() =>
      openFromEscrow(sealed, escrow.secretKey, {
        ownerId: "owner_1",
        messageForHeirId: "asset_1",
      })
    ).toThrow()
  })

  it("refuses the wrong escrow key", () => {
    const sealed = sealForEscrow(generateDek(), escrow.publicKey, asset)
    expect(() =>
      openFromEscrow(sealed, generateSealKeypair().secretKey, asset)
    ).toThrow()
  })

  it("parses a hex key and refuses a wrong length", () => {
    expect(Array.from(parseEscrowKey(bytesToHex(escrow.publicKey)))).toEqual(
      Array.from(escrow.publicKey)
    )
    expect(() => parseEscrowKey("abcd")).toThrow(/32 bytes/)
  })
})
