/**
 * Sealing a share to the guardian.
 *
 * The owner's device has the guardian's X25519 public key and nothing else —
 * no shared secret to agree on, no round trip. A sealed box gives exactly that:
 * an ephemeral keypair per seal, ECDH against the guardian's public key, HKDF
 * to a symmetric key, XChaCha20-Poly1305 to encrypt. The ephemeral secret is
 * discarded, so even the owner cannot reopen what they sealed.
 *
 *   sealed = ephPub(32) ‖ nonce(24) ‖ ciphertext‖tag
 *
 * Both public keys are bound into the AAD, so a sealed share cannot be replayed
 * against a different guardian's key even by someone who can rewrite the row.
 */
import { x25519 } from "@noble/curves/ed25519.js"
import { sha256 } from "@noble/hashes/sha2.js"
import { hkdf } from "@noble/hashes/hkdf.js"

import {
  KEY_BYTES,
  NONCE_BYTES,
  TAG_BYTES,
  assertBytes,
  concatBytes,
  utf8ToBytes,
} from "./bytes"
import { open, seal } from "./wrap"

/** X25519 keys are 32 bytes on both sides. */
export const X25519_KEY_BYTES = 32

const SEAL_INFO = utf8ToBytes("wassiya/guardian-seal/v1")
const EPH_PUB_END = X25519_KEY_BYTES

export type GuardianKeypair = {
  /** Stays on the guardian's device, gated by their own biometrics. */
  secretKey: Uint8Array
  /** Published to the owner at invite-accept time; stored server-side. */
  publicKey: Uint8Array
}

/** Generated on the guardian's device when they accept the invite. */
export function generateGuardianKeypair(): GuardianKeypair {
  const { secretKey, publicKey } = x25519.keygen()
  return { secretKey, publicKey }
}

export function guardianPublicKey(secretKey: Uint8Array): Uint8Array {
  assertBytes(secretKey, X25519_KEY_BYTES, "guardian secret key")
  return x25519.getPublicKey(secretKey)
}

/**
 * Seal a 32-byte share (S_guardian for recovery, or a per-heir guardian share)
 * to the guardian. The result is what the server is allowed to store.
 */
export function sealToGuardian(
  share: Uint8Array,
  guardianX25519Pub: Uint8Array
): Uint8Array {
  assertBytes(share, KEY_BYTES, "share")
  assertBytes(guardianX25519Pub, X25519_KEY_BYTES, "guardianX25519Pub")

  const ephemeral = x25519.keygen()
  const shared = x25519.getSharedSecret(ephemeral.secretKey, guardianX25519Pub)
  const context = concatBytes(ephemeral.publicKey, guardianX25519Pub)
  const key = deriveSealKey(shared, context)

  return concatBytes(ephemeral.publicKey, seal(key, share, context))
}

/**
 * Opened only on the guardian's device. Throws if the sealed blob was built for
 * a different guardian, or if any byte of it was altered in transit or at rest.
 */
export function openFromGuardian(
  sealed: Uint8Array,
  guardianPriv: Uint8Array
): Uint8Array {
  assertBytes(guardianPriv, X25519_KEY_BYTES, "guardianPriv")
  if (sealed.length !== EPH_PUB_END + NONCE_BYTES + KEY_BYTES + TAG_BYTES) {
    throw new Error("Sealed share has the wrong length")
  }

  const ephemeralPub = sealed.slice(0, EPH_PUB_END)
  const boxed = sealed.subarray(EPH_PUB_END)
  const shared = x25519.getSharedSecret(guardianPriv, ephemeralPub)
  const context = concatBytes(ephemeralPub, x25519.getPublicKey(guardianPriv))
  const key = deriveSealKey(shared, context)

  const share = open(boxed, key, context)
  return assertBytes(share, KEY_BYTES, "sealed share")
}

/**
 * The raw ECDH output is a curve point, not a uniform key — HKDF-Extract over
 * it with both public keys as salt is what makes it one.
 */
function deriveSealKey(shared: Uint8Array, context: Uint8Array): Uint8Array {
  return hkdf(sha256, shared, context, SEAL_INFO, KEY_BYTES)
}
