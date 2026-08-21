/**
 * The one symmetric envelope used everywhere in this package.
 *
 * XChaCha20-Poly1305 with a fresh random 24-byte nonce prepended to the
 * ciphertext. XChaCha's nonce is wide enough that random generation carries no
 * practical collision risk, so no counter state has to survive an app restart.
 */
import { xchacha20poly1305 } from "@noble/ciphers/chacha.js"

import {
  NONCE_BYTES,
  TAG_BYTES,
  assertKey,
  concatBytes,
  randomBytes,
} from "./bytes"

/**
 * Encrypt `plaintext` under `key`, returning `nonce || ciphertext||tag`.
 *
 * `aad` is authenticated but not encrypted. Callers use it to bind a message
 * to its position in a larger structure (see `asset.ts`), which is what stops
 * an attacker reordering or dropping parts they cannot read.
 */
export function seal(
  key: Uint8Array,
  plaintext: Uint8Array,
  aad?: Uint8Array
): Uint8Array {
  assertKey(key, "key")
  const nonce = randomBytes(NONCE_BYTES)
  const ciphertext = xchacha20poly1305(key, nonce, aad).encrypt(plaintext)
  return concatBytes(nonce, ciphertext)
}

/**
 * Reverse of {@link seal}. Throws if the tag does not verify — which is the
 * only signal callers get, and the only one they should act on: a tampered,
 * truncated or wrong-key input are indistinguishable here by design.
 */
export function open(
  boxed: Uint8Array,
  key: Uint8Array,
  aad?: Uint8Array
): Uint8Array {
  assertKey(key, "key")
  if (boxed.length < NONCE_BYTES + TAG_BYTES) {
    throw new Error("Ciphertext is too short to contain a nonce and a tag")
  }
  const nonce = boxed.subarray(0, NONCE_BYTES)
  const ciphertext = boxed.subarray(NONCE_BYTES)
  return xchacha20poly1305(key, nonce, aad).decrypt(ciphertext)
}

/**
 * Wrap one key under another (MK under a device/recovery KEK, a DEK under MK).
 * Identical to {@link seal}; the separate name marks the call sites where the
 * plaintext is key material, so the 32-byte length check applies to both sides.
 */
export function wrap(key: Uint8Array, kek: Uint8Array): Uint8Array {
  assertKey(key, "key")
  assertKey(kek, "kek")
  return seal(kek, key)
}

/** Reverse of {@link wrap}. Throws on a wrong KEK or a tampered wrapper. */
export function unwrap(ciphertext: Uint8Array, kek: Uint8Array): Uint8Array {
  assertKey(kek, "kek")
  const key = open(ciphertext, kek)
  assertKey(key, "unwrapped key")
  return key
}
