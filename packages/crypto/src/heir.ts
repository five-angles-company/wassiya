/**
 * Per-heir release bundles.
 *
 * An heir never receives MK. What they get, once and only once a claim reaches
 * "released", is a bundle holding just the DEKs for the assets routed to them
 * plus the keys to their personal message — nothing about anyone else's share
 * of the vault.
 *
 * The bundle key is a second 2-of-2 split, K_h = S_server_h ⊕ S_guardian_h. The
 * server withholds S_server_h until release; the guardian holds the other half.
 * Neither party alone can open a bundle, and the bundle itself is stored in
 * file storage where the server can see only ciphertext.
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
  xor,
} from "./bytes"
import { open, seal } from "./wrap"

/** Keys carried inside a bundle, addressed by the id the heir will look up. */
export type KeyMap = Record<string, Uint8Array>

export type HeirShares = {
  /** Held by the server, released only on a released claim. */
  sServer: Uint8Array
  /** Sealed to the guardian; the server stores only the sealed form. */
  sGuardian: Uint8Array
}

export type ReleaseBundleContents = {
  /** assetId → the asset's DEK. */
  deks: KeyMap
  /** messageId → the key for that heir's personal message. */
  messageKeys: KeyMap
}

const BUNDLE_VERSION = 1
const BUNDLE_AAD = utf8ToBytes("wassiya/release-bundle/v1")

/** Fresh shares for one heir. Regenerated whenever the heir's routing changes. */
export function makeHeirShares(): HeirShares {
  return { sServer: randomBytes(KEY_BYTES), sGuardian: randomBytes(KEY_BYTES) }
}

/** K_h. Exported because the release ceremony combines the halves explicitly. */
export function heirKey(
  sServer: Uint8Array,
  sGuardian: Uint8Array
): Uint8Array {
  assertKey(sServer, "sServer")
  assertKey(sGuardian, "sGuardian")
  return xor(sServer, sGuardian)
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
 * Opened on the heir's device after release, with S_server_h from the backend
 * and S_guardian_h from the guardian. Throws for a bundle built for a different
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
