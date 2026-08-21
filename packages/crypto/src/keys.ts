/**
 * Root key generation.
 *
 * Both keys are raw CSPRNG output — no passphrase, no KDF, nothing the owner
 * could weaken by choosing badly. MK is generated once per vault on the owner's
 * device and never leaves it unencrypted; a DEK is generated once per asset.
 */
import { KEY_BYTES, randomBytes } from "./bytes"

/** The vault master key. Generated on-device, stored only as ciphertext. */
export function generateMk(): Uint8Array {
  return randomBytes(KEY_BYTES)
}

/** A per-asset data encryption key, wrapped by MK before it is persisted. */
export function generateDek(): Uint8Array {
  return randomBytes(KEY_BYTES)
}
