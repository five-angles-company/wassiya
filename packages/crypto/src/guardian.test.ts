import { describe, expect, it } from "vitest"

import { KEY_BYTES, randomBytes } from "./bytes"
import { generateMk } from "./keys"
import {
  generateGuardianKeypair,
  guardianPublicKey,
  openFromGuardian,
  sealToGuardian,
} from "./guardian"
import { recoverMk, splitRecovery } from "./recovery"

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

describe("the full recovery ceremony", () => {
  it("restores MK from the paper sheet plus the guardian's sealed share", () => {
    const mk = generateMk()
    const guardian = generateGuardianKeypair()

    // On the owner's device at setup: split, seal, keep only ciphertext.
    const { sPaper, sGuardian, mkWrappedByRecovery } = splitRecovery(mk)
    const guardianShareSealed = sealToGuardian(sGuardian, guardian.publicKey)

    // Later, on a new device: the guardian decrypts their half and hands it
    // over out of band; the owner reads the paper sheet.
    const recoveredGuardianShare = openFromGuardian(
      guardianShareSealed,
      guardian.secretKey
    )
    expect(
      Array.from(recoverMk(sPaper, recoveredGuardianShare, mkWrappedByRecovery))
    ).toEqual(Array.from(mk))
  })
})
