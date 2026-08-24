/**
 * Base64url for the recovery sheet's QR payload.
 *
 * Hermes has no `btoa`, and the one value that needs encoding here — the
 * 72-byte wrapped-key blob — is small enough that a table-driven encoder is
 * cheaper than another native dependency. URL-safe alphabet and no padding
 * because QR density is the only thing being optimised: `-` and `_` avoid the
 * `+`/`/` that some scanners mangle, and dropping `=` saves a character.
 */
const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"

export function base64UrlEncode(bytes: Uint8Array): string {
  let out = ""
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!
    const b = bytes[i + 1]
    const c = bytes[i + 2]

    out += ALPHABET[a >>> 2]!
    out += ALPHABET[((a & 0x03) << 4) | ((b ?? 0) >>> 4)]!
    if (b === undefined) break
    out += ALPHABET[((b & 0x0f) << 2) | ((c ?? 0) >>> 6)]!
    if (c === undefined) break
    out += ALPHABET[c & 0x3f]!
  }
  return out
}
