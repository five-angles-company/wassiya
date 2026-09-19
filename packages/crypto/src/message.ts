/**
 * An heir's personal message, sealed under its own random key.
 *
 * The key is wrapped by MK for the owner's device and travels to the heir in
 * the release bundle (`messageKeys`), exactly like an asset's DEK. The AAD
 * binds the blob to this purpose, so a message cannot be passed off as an
 * asset label or any other sealed payload under the same key.
 */
import { assertKey, bytesToUtf8, utf8ToBytes } from "./bytes"
import { open, seal } from "./wrap"

export const MESSAGE_AAD = utf8ToBytes("wassiya/heir-message/v1")

/** The id a message key is stored under inside a release bundle. */
export const MESSAGE_KEY_ID = "message"

export function sealMessage(text: string, key: Uint8Array): Uint8Array {
  assertKey(key, "message key")
  return seal(key, utf8ToBytes(text), MESSAGE_AAD)
}

export function openMessage(sealed: Uint8Array, key: Uint8Array): string {
  assertKey(key, "message key")
  return bytesToUtf8(open(sealed, key, MESSAGE_AAD))
}
