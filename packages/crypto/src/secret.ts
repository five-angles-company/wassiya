/**
 * An asset's secret fields — a seed phrase, a password, a note body — sealed
 * under the asset's DEK and stored on the row itself, not as a file.
 *
 * Under the DEK, like the label, so it reaches whoever legitimately holds that
 * key: the owner today, the executor after release. The AAD keeps a secret
 * from being opened as a label under the same key.
 */
import { assertKey, bytesToUtf8, utf8ToBytes } from "./bytes"
import { open, seal } from "./wrap"

export const SECRET_AAD = utf8ToBytes("wassiya/asset-secret/v1")

/** A row is capped at 1 MiB; a secret is text and must leave room for the rest. */
export const MAX_SECRET_BYTES = 256 * 1024

export function sealSecret(secret: string, dek: Uint8Array): Uint8Array {
  assertKey(dek, "dek")
  const plaintext = utf8ToBytes(secret)
  if (plaintext.length > MAX_SECRET_BYTES) {
    throw new Error(`An asset secret may not exceed ${MAX_SECRET_BYTES} bytes`)
  }
  return seal(dek, plaintext, SECRET_AAD)
}

export function openSecret(sealed: Uint8Array, dek: Uint8Array): string {
  assertKey(dek, "dek")
  return bytesToUtf8(open(sealed, dek, SECRET_AAD))
}
