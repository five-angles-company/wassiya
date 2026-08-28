import { describe, expect, it } from "vitest"

import { KEY_BYTES, randomBytes } from "./bytes"
import {
  generateGuardianKeypair,
  guardianPublicKey,
  openFromGuardian,
  sealToGuardian,
} from "./guardian"
import { heirKey, makeHeirShares } from "./heir"

describe("sealToGuardian / openFromGuardian", () => {
  it("round-trips a share to the guardian who owns the key", () => {
    const guardian = generateGuardianKeypair()
    const share = randomBytes(KEY_BYTES)
    const sealed = sealToGuardian(share, guardian.publicKey)
    expect(Array.from(openFromGuardian(sealed, guardian.secretKey))).toEqual(
      Array.from(share)
    )
  })

  it("derives the same public key the keypair reports", () => {
    const guardian = generateGuardianKeypair()
    expect(Array.from(guardianPublicKey(guardian.secretKey))).toEqual(
      Array.from(guardian.publicKey)
    )
  })

  it("cannot be opened by a different guardian", () => {
    const intended = generateGuardianKeypair()
    const other = generateGuardianKeypair()
    const sealed = sealToGuardian(randomBytes(KEY_BYTES), intended.publicKey)
    expect(() => openFromGuardian(sealed, other.secretKey)).toThrow()
  })

  it("cannot be reopened by the owner who sealed it", () => {
    // The ephemeral secret is discarded, so the sealing device keeps nothing
    // that would let it recover the share it just handed over.
    const guardian = generateGuardianKeypair()
    const sealed = sealToGuardian(randomBytes(KEY_BYTES), guardian.publicKey)
    const impostor = generateGuardianKeypair()
    expect(() => openFromGuardian(sealed, impostor.secretKey)).toThrow()
  })

  it("uses a fresh ephemeral key each time", () => {
    const guardian = generateGuardianKeypair()
    const share = randomBytes(KEY_BYTES)
    const a = sealToGuardian(share, guardian.publicKey)
    const b = sealToGuardian(share, guardian.publicKey)
    expect(Array.from(a)).not.toEqual(Array.from(b))
  })

  it("detects a flipped byte anywhere in the sealed blob", () => {
    const guardian = generateGuardianKeypair()
    const sealed = sealToGuardian(randomBytes(KEY_BYTES), guardian.publicKey)
    for (let i = 0; i < sealed.length; i++) {
      const tampered = sealed.slice()
      tampered[i] = tampered[i]! ^ 0x80
      expect(() => openFromGuardian(tampered, guardian.secretKey)).toThrow()
    }
  })

  it("rejects a sealed blob of the wrong length", () => {
    const guardian = generateGuardianKeypair()
    const sealed = sealToGuardian(randomBytes(KEY_BYTES), guardian.publicKey)
    expect(() =>
      openFromGuardian(sealed.slice(0, sealed.length - 1), guardian.secretKey)
    ).toThrow(/wrong length/)
  })
})

describe("the guardian's remaining leg: release", () => {
  it("restores K_h from the server share plus the guardian's sealed share", () => {
    // Recovery is the sheet alone now — the guardian is not in it. Release is
    // where the two-of-two survives, and this is the ceremony that proves it:
    // the owner seals S_guardian_h at bundle-build time, the server withholds
    // S_server_h until a claim is released, and neither half alone is K_h.
    const guardian = generateGuardianKeypair()
    const { sServer, sGuardian } = makeHeirShares()

    const sealed = sealToGuardian(sGuardian, guardian.publicKey)
    const handedOver = openFromGuardian(sealed, guardian.secretKey)

    expect(Array.from(heirKey(sServer, handedOver))).toEqual(
      Array.from(heirKey(sServer, sGuardian))
    )
    expect(Array.from(heirKey(sServer, handedOver))).not.toEqual(
      Array.from(sServer)
    )
  })
})
