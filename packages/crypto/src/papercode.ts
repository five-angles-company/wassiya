/**
 * The recovery sheet's 32-byte secret rendered as something a person can copy
 * off paper under stress and a phone keyboard can accept without a numeric row.
 *
 *   WSY1-XXXX-XXXX-…    prefix + version, then 14 groups of 4
 *
 * Payload is 35 bytes — version(1) ‖ secret(32) ‖ CRC-16(2) — which is exactly
 * 280 bits, so the Base32 encoding lands on 56 characters with no padding and
 * no ragged final group.
 *
 * The alphabet drops 0/O and 1/I, the four glyphs handwriting confuses, leaving
 * exactly 32 symbols: digits 2-9 plus A-Z minus I and O.
 *
 * CRC-16/CCITT-FALSE detects every burst error up to 16 bits. A single mistyped
 * character perturbs a 5-bit window that straddles at most two bytes — a burst
 * of 13 bits at worst — so every single-character typo is caught with
 * certainty, not with probability.
 *
 * The byte layout is what every printed sheet carries. Changing it strands
 * every sheet already in a drawer.
 */
import { assertKey, concatBytes } from "./bytes"

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
const GROUP = 4
const SHARE_BYTES = 32
const PAYLOAD_BYTES = 1 + SHARE_BYTES + 2
const CODE_CHARS = (PAYLOAD_BYTES * 8) / 5
const PREFIX = "WSY"
const LABEL = "Recovery code"

/** CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF, no reflection, no final XOR. */
export function crc16(bytes: Uint8Array): number {
  let crc = 0xffff
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i]! << 8
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc
}

export type DecodedPaperCode = { sPaper: Uint8Array; version: number }

/**
 * Render the sheet's secret. `version` is the keyring's `paperVersion`; it
 * appears both in the human-readable prefix and inside the checksummed payload,
 * and the decoder rejects a code whose two copies disagree.
 */
export function encodePaperCode(sPaper: Uint8Array, version: number): string {
  assertKey(sPaper, "sPaper")
  assertVersion(version)

  const body = concatBytes(new Uint8Array([version]), sPaper)
  const checksum = crc16(body)
  const payload = concatBytes(
    body,
    new Uint8Array([(checksum >>> 8) & 0xff, checksum & 0xff])
  )

  const encoded = base32Encode(payload)
  const groups: string[] = []
  for (let i = 0; i < encoded.length; i += GROUP) {
    groups.push(encoded.slice(i, i + GROUP))
  }
  return `${PREFIX}${version}-${groups.join("-")}`
}

/**
 * Parse a typed-in code. Hyphens, spaces and case are all forgiven; anything
 * else is a hard error. Errors quote positions and lengths, never characters —
 * this string is key material and must not reach a log through a message.
 */
export function decodePaperCode(code: string): DecodedPaperCode {
  const normalised = code.replace(/[\s-]/g, "").toUpperCase()
  if (!normalised.startsWith(PREFIX)) {
    throw new Error(`${LABEL} must start with ${PREFIX}`)
  }

  // The encoded body is a fixed 56 characters, so the version digits are
  // whatever sits between the prefix and that tail. Splitting by length rather
  // than by a greedy \d+ matters: the alphabet contains digits, so a regex
  // would happily swallow the first group into the version.
  const rest = normalised.slice(PREFIX.length)
  if (rest.length !== CODE_CHARS + 1 && rest.length !== CODE_CHARS + 2) {
    throw new Error(
      `${LABEL} must be ${PREFIX}<version> plus ${CODE_CHARS} characters, received ${rest.length} after the prefix`
    )
  }
  const versionText = rest.slice(0, rest.length - CODE_CHARS)
  const encoded = rest.slice(rest.length - CODE_CHARS)
  if (!/^\d+$/.test(versionText)) {
    throw new Error(`${LABEL} must be ${PREFIX}<version> followed by the code`)
  }
  const prefixVersion = Number.parseInt(versionText, 10)

  const payload = base32Decode(encoded)
  const body = payload.slice(0, PAYLOAD_BYTES - 2)
  const checksum =
    (payload[PAYLOAD_BYTES - 2]! << 8) | payload[PAYLOAD_BYTES - 1]!
  if (crc16(body) !== checksum) {
    throw new Error(`${LABEL} checksum failed — check for a mistyped character`)
  }

  const version = body[0]!
  if (version !== prefixVersion) {
    throw new Error(`${LABEL} version does not match its prefix`)
  }
  return { sPaper: body.slice(1), version }
}

function assertVersion(version: number): void {
  if (!Number.isSafeInteger(version) || version < 1 || version > 99) {
    throw new Error(`${LABEL} version must be an integer between 1 and 99`)
  }
}

/** Big-endian bit packing; `PAYLOAD_BYTES * 8` is a multiple of 5, so no pad. */
function base32Encode(bytes: Uint8Array): string {
  let out = ""
  let buffer = 0
  let bits = 0
  for (let i = 0; i < bytes.length; i++) {
    buffer = ((buffer << 8) | bytes[i]!) >>> 0
    bits += 8
    while (bits >= 5) {
      bits -= 5
      out += ALPHABET[(buffer >>> bits) & 0x1f]!
    }
    buffer &= (1 << bits) - 1
  }
  return out
}

function base32Decode(encoded: string): Uint8Array {
  const out = new Uint8Array((encoded.length * 5) / 8)
  let buffer = 0
  let bits = 0
  let written = 0
  for (let i = 0; i < encoded.length; i++) {
    const value = ALPHABET.indexOf(encoded[i]!)
    if (value < 0) {
      throw new Error(
        `${LABEL} contains an unusable character at position ${i + 1}`
      )
    }
    buffer = ((buffer << 5) | value) >>> 0
    bits += 5
    if (bits >= 8) {
      bits -= 8
      out[written++] = (buffer >>> bits) & 0xff
    }
    buffer &= (1 << bits) - 1
  }
  return out
}

const SHEET_PREFIX = /WSY[A-Z]?\d+\s*-/i
const SHEET_RUN = /(?:[2-9A-HJ-NP-Z]{4}[\s\-–—]*){8,}/g

/**
 * Whether free text looks like it carries a recovery code — for the support
 * composers, which warn before a sheet is pasted into a chat.
 *
 * ⚠️ Mirrored by `looksLikeRecoveryCode` in the backend's `model/support.ts`,
 * which refuses the same text server-side and cannot import this package.
 * Change the two together. The digit requirement is what keeps a run of
 * ordinary four-letter words from matching.
 */
export function looksLikeRecoveryCode(text: string): boolean {
  if (SHEET_PREFIX.test(text)) return true
  for (const match of text.toUpperCase().matchAll(SHEET_RUN)) {
    if (/[2-9]/.test(match[0])) return true
  }
  return false
}
