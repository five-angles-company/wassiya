/**
 * Byte primitives shared by every module in this package.
 *
 * Nothing here imports React Native, Node, or the DOM: the package has to run
 * unchanged inside Hermes (Expo), the browser, a Next.js server and Vitest.
 */

/** Every symmetric key in the Wassiya hierarchy is 256-bit. */
export const KEY_BYTES = 32

/** XChaCha20-Poly1305 nonce width. */
export const NONCE_BYTES = 24

/** Poly1305 authentication tag width. */
export const TAG_BYTES = 16

/**
 * Cryptographically secure randomness, from the platform and nowhere else.
 *
 * Hermes has no `crypto` global of its own — Expo apps get one from
 * `expo-crypto` / `react-native-get-random-values`, which must be imported
 * once at app entry before any call into this package. Failing loudly beats
 * silently falling back to `Math.random()`.
 */
export function randomBytes(length: number): Uint8Array {
  assertNonNegativeInt(length, "length")
  const source = globalThis.crypto
  if (source === undefined || typeof source.getRandomValues !== "function") {
    throw new Error(
      "No CSPRNG available: globalThis.crypto.getRandomValues is missing. " +
        "On React Native, import 'expo-crypto' (or 'react-native-get-random-values') " +
        "at app entry before calling @workspace/crypto."
    )
  }
  // Web Crypto refuses more than 65 536 bytes in one call, on every platform.
  // Keys and nonces never come close, but this is also the package's public
  // CSPRNG, so fill in blocks rather than throwing on a large request.
  const out = new Uint8Array(length)
  for (let offset = 0; offset < length; offset += MAX_RANDOM_BLOCK) {
    source.getRandomValues(
      out.subarray(offset, Math.min(offset + MAX_RANDOM_BLOCK, length))
    )
  }
  return out
}

const MAX_RANDOM_BLOCK = 65536

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  let total = 0
  for (const part of parts) {
    total += part.length
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

/** Constant-time equality. Never short-circuits on the first differing byte. */
export function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false
  }
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!
  }
  return diff === 0
}

/**
 * Length assertion. The message names the field and the two lengths and never
 * the bytes — key material must not reach a log line through a thrown error.
 */
export function assertBytes(
  value: Uint8Array,
  length: number,
  label: string
): Uint8Array {
  if (!(value instanceof Uint8Array)) {
    throw new Error(`${label} must be a Uint8Array`)
  }
  if (value.length !== length) {
    throw new Error(
      `${label} must be ${length} bytes, received ${value.length}`
    )
  }
  return value
}

/** A 256-bit key, checked. */
export function assertKey(value: Uint8Array, label: string): Uint8Array {
  return assertBytes(value, KEY_BYTES, label)
}

export function assertNonNegativeInt(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`)
  }
  return value
}

/** Big-endian uint32, used for chunk indices and counts inside AAD. */
export function uint32BE(value: number): Uint8Array {
  assertNonNegativeInt(value, "value")
  if (value > 0xffffffff) {
    throw new Error("value exceeds uint32")
  }
  return new Uint8Array([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ])
}

export function readUint32BE(bytes: Uint8Array, offset: number): number {
  if (offset + 4 > bytes.length) {
    throw new Error("Truncated uint32")
  }
  return (
    ((bytes[offset]! << 24) >>> 0) +
    (bytes[offset + 1]! << 16) +
    (bytes[offset + 2]! << 8) +
    bytes[offset + 3]!
  )
}

/** UTF-8 encode. `TextEncoder` is present in Hermes, browsers and Node 20+. */
export function utf8ToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

const HEX = "0123456789abcdef"

/** Hex, so keys serialise as text without a base64 polyfill. */
export function bytesToHex(bytes: Uint8Array): string {
  let out = ""
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]!
    out += HEX[byte >>> 4]! + HEX[byte & 0x0f]!
  }
  return out
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Hex string must have an even length")
  }
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) {
    const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    if (Number.isNaN(byte)) {
      throw new Error(`Invalid hex at offset ${i * 2}`)
    }
    out[i] = byte
  }
  return out
}
