/**
 * A 32-byte secret rendered as something a person can copy off paper under
 * stress and a phone keyboard can accept without a numeric row.
 *
 *   WSY1-XXXX-XXXX-…    the owner's recovery sheet   (prefix + 14 groups of 4)
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
 * ## Two kinds of sheet, and why the prefix is not what separates them
 *
 * The human-readable prefix sits **outside** the checksum, so it is a label and
 * nothing more: a `WSYG1-…` and a `WSY1-…` carrying the same body bytes would
 * be the same secret wearing two names, and a decoder that only compared
 * prefixes would accept either. That is not the guarantee a second kind of
 * sheet needs.
 *
 * `CodeFormat.domain` is what actually separates them. It is folded into the
 * checksum and **never transmitted**, so a code minted for one purpose fails
 * the CRC of the other — the same trick `seal.ts` plays with its info string,
 * and `assetHeader.ts` with its magic.
 * It costs no characters: the code stays 56 long either way.
 *
 * An empty domain is the owner's original format, byte for byte, so every sheet
 * printed before this existed still decodes.
 */
import { assertKey, concatBytes } from "./bytes"

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
const GROUP = 4
const SHARE_BYTES = 32
const PAYLOAD_BYTES = 1 + SHARE_BYTES + 2
const CODE_CHARS = (PAYLOAD_BYTES * 8) / 5

/** What distinguishes one kind of printed code from another. */
export type CodeFormat = {
  /** The human-readable marker before the version digits. A label only. */
  prefix: string
  /**
   * Mixed into the checksum, never printed. This is the real separator — see
   * the header. Empty means the owner's original recovery format.
   */
  domain: Uint8Array
  /** How errors name this code to the person typing it. */
  label: string
}

/** The owner's recovery sheet. Empty domain: the format as first shipped. */
export const RECOVERY_CODE_FORMAT: CodeFormat = {
  prefix: "WSY",
  domain: new Uint8Array(0),
  label: "Recovery code",
}


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

/**
 * Render a secret in the given format. `version` appears both in the
 * human-readable prefix and inside the checksummed payload, and the decoder
 * rejects a code whose two copies disagree.
 */
export function encodeSecretCode(
  format: CodeFormat,
  secret: Uint8Array,
  version: number
): string {
  assertKey(secret, "secret")
  assertVersion(version, format)

  const body = concatBytes(new Uint8Array([version]), secret)
  const checksum = crc16(concatBytes(format.domain, body))
  const payload = concatBytes(
    body,
    new Uint8Array([(checksum >>> 8) & 0xff, checksum & 0xff])
  )

  const encoded = base32Encode(payload)
  const groups: string[] = []
  for (let i = 0; i < encoded.length; i += GROUP) {
    groups.push(encoded.slice(i, i + GROUP))
  }
  return `${format.prefix}${version}-${groups.join("-")}`
}

export type DecodedSecretCode = { secret: Uint8Array; version: number }

/**
 * Parse a typed-in code. Hyphens, spaces and case are all forgiven; anything
 * else is a hard error. Errors quote positions and lengths, never characters —
 * this string is key material and must not reach a log through a message.
 */
export function decodeSecretCode(
  format: CodeFormat,
  code: string
): DecodedSecretCode {
  const normalised = code.replace(/[\s-]/g, "").toUpperCase()
  if (!normalised.startsWith(format.prefix)) {
    throw new Error(`${format.label} must start with ${format.prefix}`)
  }

  // The encoded body is a fixed 56 characters, so the version digits are
  // whatever sits between the prefix and that tail. Splitting by length rather
  // than by a greedy \d+ matters: the alphabet contains digits, so a regex
  // would happily swallow the first group into the version.
  const rest = normalised.slice(format.prefix.length)
  if (rest.length !== CODE_CHARS + 1 && rest.length !== CODE_CHARS + 2) {
    throw new Error(
      `${format.label} must be ${format.prefix}<version> plus ${CODE_CHARS} characters, received ${rest.length} after the prefix`
    )
  }
  const versionText = rest.slice(0, rest.length - CODE_CHARS)
  const encoded = rest.slice(rest.length - CODE_CHARS)
  if (!/^\d+$/.test(versionText)) {
    throw new Error(
      `${format.label} must be ${format.prefix}<version> followed by the code`
    )
  }
  const prefixVersion = Number.parseInt(versionText, 10)

  const payload = base32Decode(encoded, format)
  const body = payload.slice(0, PAYLOAD_BYTES - 2)
  const checksum =
    (payload[PAYLOAD_BYTES - 2]! << 8) | payload[PAYLOAD_BYTES - 1]!
  // Also what rejects a code from the wrong family: a recovery sheet typed here
  // checksums against the wrong domain and fails exactly as a typo would.
  if (crc16(concatBytes(format.domain, body)) !== checksum) {
    throw new Error(
      `${format.label} checksum failed — check for a mistyped character`
    )
  }

  const version = body[0]!
  if (version !== prefixVersion) {
    throw new Error(`${format.label} version does not match its prefix`)
  }
  return { secret: body.slice(1), version }
}

export type DecodedPaperCode = { sPaper: Uint8Array; version: number }

/**
 * The owner's recovery sheet. `version` is the keyring's `paperVersion`.
 *
 * Kept as its own name because it is what every caller already asks for, and
 * because `sPaper` says which share this is in a system that has several.
 */
export function encodePaperCode(sPaper: Uint8Array, version: number): string {
  return encodeSecretCode(RECOVERY_CODE_FORMAT, sPaper, version)
}

export function decodePaperCode(code: string): DecodedPaperCode {
  const { secret, version } = decodeSecretCode(RECOVERY_CODE_FORMAT, code)
  return { sPaper: secret, version }
}

function assertVersion(version: number, format: CodeFormat): void {
  if (!Number.isSafeInteger(version) || version < 1 || version > 99) {
    throw new Error(`${format.label} version must be an integer between 1 and 99`)
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

function base32Decode(encoded: string, format: CodeFormat): Uint8Array {
  const out = new Uint8Array((encoded.length * 5) / 8)
  let buffer = 0
  let bits = 0
  let written = 0
  for (let i = 0; i < encoded.length; i++) {
    const value = ALPHABET.indexOf(encoded[i]!)
    if (value < 0) {
      throw new Error(
        `${format.label} contains an unusable character at position ${i + 1}`
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
