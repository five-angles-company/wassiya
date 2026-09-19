/// <reference types="node" />
import { constants, generateKeyPairSync, privateDecrypt } from "node:crypto"
import { describe, expect, it } from "vitest"

import { randomBytes } from "./bytes"
import {
  escrowKeyFingerprint,
  lockHeirKey,
  parseEscrowPublicKey,
  parseUnlockedHeirKey,
  rsaOaepEncrypt,
} from "./escrow"

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 3072,
})
const pem = publicKey.export({ type: "spki", format: "pem" }).toString()
const der = new Uint8Array(publicKey.export({ type: "spki", format: "der" }))

// What the dev backend and Cloud KMS both do: RSA-OAEP, SHA-256, empty label.
function unlock(locked: Uint8Array): Uint8Array {
  return new Uint8Array(
    privateDecrypt(
      { key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
      locked
    )
  )
}

const context = { ownerId: "owner_1", heirId: "heir_1" }

describe("parseEscrowPublicKey", () => {
  it("reads PEM and DER to the same key", () => {
    const fromPem = parseEscrowPublicKey(pem)
    const fromDer = parseEscrowPublicKey(der)
    expect(fromPem.n).toBe(fromDer.n)
    expect(fromPem.e).toBe(65537n)
    expect(fromPem.byteLength).toBe(384)
  })

  it("refuses a key below 3072 bits", () => {
    const small = generateKeyPairSync("rsa", { modulusLength: 2048 })
    const smallPem = small.publicKey.export({ type: "spki", format: "pem" }).toString()
    expect(() => parseEscrowPublicKey(smallPem)).toThrow(/3072/)
  })

  it("fingerprints PEM and DER identically", () => {
    expect(escrowKeyFingerprint(pem)).toBe(escrowKeyFingerprint(der))
    expect(escrowKeyFingerprint(pem)).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe("rsaOaepEncrypt", () => {
  it("is decrypted by Node's RSA-OAEP-SHA256", () => {
    const message = randomBytes(200)
    const locked = rsaOaepEncrypt(message, parseEscrowPublicKey(pem))
    expect(locked.length).toBe(384)
    expect(Array.from(unlock(locked))).toEqual(Array.from(message))
  })

  it("randomises every encryption", () => {
    const key = parseEscrowPublicKey(pem)
    const message = randomBytes(32)
    expect(Array.from(rsaOaepEncrypt(message, key))).not.toEqual(
      Array.from(rsaOaepEncrypt(message, key))
    )
  })

  it("refuses a message longer than OAEP allows", () => {
    expect(() =>
      rsaOaepEncrypt(randomBytes(384 - 64 - 1), parseEscrowPublicKey(pem))
    ).toThrow(/too long/)
  })
})

describe("lockHeirKey / parseUnlockedHeirKey", () => {
  it("round-trips K_h for the heir it was locked for", () => {
    const kH = randomBytes(32)
    const locked = lockHeirKey(context, kH, parseEscrowPublicKey(pem))
    const opened = parseUnlockedHeirKey(unlock(locked), context)
    expect(Array.from(opened)).toEqual(Array.from(kH))
  })

  it("refuses a key locked for another heir", () => {
    const locked = lockHeirKey(context, randomBytes(32), parseEscrowPublicKey(pem))
    expect(() =>
      parseUnlockedHeirKey(unlock(locked), { ...context, heirId: "heir_2" })
    ).toThrow(/different heir/)
  })

  it("refuses a key locked under another owner", () => {
    const locked = lockHeirKey(context, randomBytes(32), parseEscrowPublicKey(pem))
    expect(() =>
      parseUnlockedHeirKey(unlock(locked), { ...context, ownerId: "owner_2" })
    ).toThrow(/different heir/)
  })

  it("refuses a malformed payload", () => {
    expect(() =>
      parseUnlockedHeirKey(new TextEncoder().encode("not json"), context)
    ).toThrow(/malformed/)
  })
})
