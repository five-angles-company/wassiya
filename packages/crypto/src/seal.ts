/**
 * A sealed box: encrypt a 32-byte key to an X25519 public key with nothing else
 * shared. The escrow lock (`escrow.ts`) is built on it.
 *
 *   sealed = ephPub(32) ‖ nonce(24) ‖ ciphertext ‖ tag(16)
 *
 * Both public keys are bound into the AAD and the HKDF salt, so a sealed box
 * cannot be replayed against a different recipient key. `aad` binds it to a
 * caller's context as well. The ephemeral secret is discarded, so not even the
 * sealer can reopen it.
 */
import { x25519 } from "@noble/curves/ed25519.js"
import { hkdf } from "@noble/hashes/hkdf.js"
import { sha256 } from "@noble/hashes/sha2.js"

import {
  KEY_BYTES,
  NONCE_BYTES,
  TAG_BYTES,
  assertBytes,
  concatBytes,
  utf8ToBytes,
} from "./bytes"
import { open, seal } from "./wrap"

export const SEAL_KEY_BYTES = 32

// Versioned, so a box sealed by a future construction can never be opened as
// this one.
const SEAL_INFO = utf8ToBytes("wassiya/sealed-box/v1")
/** Length of every sealed key: ephPub ‖ nonce ‖ key ‖ tag. */
export const SEALED_KEY_BYTES =
  SEAL_KEY_BYTES + NONCE_BYTES + KEY_BYTES + TAG_BYTES

export type SealKeypair = { secretKey: Uint8Array; publicKey: Uint8Array }

export function generateSealKeypair(): SealKeypair {
  const { secretKey, publicKey } = x25519.keygen()
  return { secretKey, publicKey }
}

/** Seal a 32-byte key to `recipientPublicKey`, bound to `aad`. */
export function sealKeyTo(
  key: Uint8Array,
  recipientPublicKey: Uint8Array,
  aad: Uint8Array = new Uint8Array(0)
): Uint8Array {
  assertBytes(key, KEY_BYTES, "key")
  assertBytes(recipientPublicKey, SEAL_KEY_BYTES, "recipientPublicKey")

  const ephemeral = x25519.keygen()
  const shared = x25519.getSharedSecret(ephemeral.secretKey, recipientPublicKey)
  const context = concatBytes(ephemeral.publicKey, recipientPublicKey)
  const boxKey = hkdf(sha256, shared, context, SEAL_INFO, KEY_BYTES)

  return concatBytes(
    ephemeral.publicKey,
    seal(boxKey, key, concatBytes(context, aad))
  )
}

/**
 * Throws if the box was sealed to another key, under another `aad`, or altered
 * in any byte.
 */
export function openSealedKey(
  sealed: Uint8Array,
  recipientSecretKey: Uint8Array,
  aad: Uint8Array = new Uint8Array(0)
): Uint8Array {
  assertBytes(recipientSecretKey, SEAL_KEY_BYTES, "recipientSecretKey")
  if (sealed.length !== SEALED_KEY_BYTES) {
    throw new Error("Sealed key has the wrong length")
  }

  const ephemeralPub = sealed.slice(0, SEAL_KEY_BYTES)
  const shared = x25519.getSharedSecret(recipientSecretKey, ephemeralPub)
  const context = concatBytes(
    ephemeralPub,
    x25519.getPublicKey(recipientSecretKey)
  )
  const boxKey = hkdf(sha256, shared, context, SEAL_INFO, KEY_BYTES)

  return assertBytes(
    open(sealed.subarray(SEAL_KEY_BYTES), boxKey, concatBytes(context, aad)),
    KEY_BYTES,
    "sealed key"
  )
}
