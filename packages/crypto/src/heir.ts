/**
 * Per-heir release bundles.
 *
 * An heir never receives MK. What they get, once and only once a claim reaches
 * "released", is a bundle holding just the DEKs for the assets routed to them
 * plus the keys to their personal message — nothing about anyone else's share
 * of the vault.
 *
 * The bundle key K_h is fresh random bytes per rebuild (`generateHeirKey`),
 * locked on the device to the escrow key (`./escrow`) and unlocked by Wassiya
 * only at release. The bundle itself sits in file storage as ciphertext.
 *
 * The owner's device rebuilds every affected bundle whenever routing changes.
 */
import {
  KEY_BYTES,
  assertKey,
  bytesToHex,
  bytesToUtf8,
  hexToBytes,
  randomBytes,
  utf8ToBytes,
} from "./bytes"
import { open, seal } from "./wrap"

/** Keys carried inside a bundle, addressed by the id the heir will look up. */
export type KeyMap = Record<string, Uint8Array>

export type ReleaseBundleContents = {
  /** assetId → the asset's DEK. */
  deks: KeyMap
  /** messageId → the key for that heir's personal message. */
  messageKeys: KeyMap
}

const BUNDLE_VERSION = 1
const BUNDLE_AAD = utf8ToBytes("wassiya/release-bundle/v1")

/** A fresh K_h. Regenerated on every rebuild, so an old one opens nothing new. */
export function generateHeirKey(): Uint8Array {
  return randomBytes(KEY_BYTES)
}

/**
 * Serialise and encrypt one heir's keys under K_h. The result is uploaded to
 * file storage as an opaque blob; nothing about its contents is legible to the
 * server, including how many assets it covers (padding is not attempted here —
 * see the README note on metadata).
 */
export function buildReleaseBundle(
  deks: KeyMap,
  messageKeys: KeyMap,
  kH: Uint8Array
): Uint8Array {
  assertKey(kH, "kH")
  const payload = {
    v: BUNDLE_VERSION,
    deks: encodeKeyMap(deks, "deks"),
    messageKeys: encodeKeyMap(messageKeys, "messageKeys"),
  }
  return seal(kH, utf8ToBytes(JSON.stringify(payload)), BUNDLE_AAD)
}

/**
 * Opened in the heir's browser after release, with K_h unlocked from escrow
 * and sealed to that browser. Throws for a bundle built for a different
 * heir — their K_h differs, so the Poly1305 tag simply does not verify.
 */
export function openReleaseBundle(
  bundle: Uint8Array,
  kH: Uint8Array
): ReleaseBundleContents {
  assertKey(kH, "kH")
  const parsed: unknown = JSON.parse(bytesToUtf8(open(bundle, kH, BUNDLE_AAD)))
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    (parsed as { v?: unknown }).v !== BUNDLE_VERSION
  ) {
    throw new Error("Unsupported release bundle version")
  }
  const record = parsed as { deks?: unknown; messageKeys?: unknown }
  return {
    deks: decodeKeyMap(record.deks, "deks"),
    messageKeys: decodeKeyMap(record.messageKeys, "messageKeys"),
  }
}

function encodeKeyMap(map: KeyMap, label: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [id, key] of Object.entries(map)) {
    assertKey(key, `${label}[${id}]`)
    out[id] = bytesToHex(key)
  }
  return out
}

function decodeKeyMap(value: unknown, label: string): KeyMap {
  if (typeof value !== "object" || value === null) {
    throw new Error(`Release bundle is missing ${label}`)
  }
  const out: KeyMap = {}
  for (const [id, hex] of Object.entries(value as Record<string, unknown>)) {
    if (typeof hex !== "string") {
      throw new Error(`Release bundle has a malformed ${label} entry`)
    }
    out[id] = assertKey(hexToBytes(hex), `${label}[${id}]`)
  }
  return out
}
