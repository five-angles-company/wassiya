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

/** The standard alphabet, for anything that has to be read by a decoder. */
const STANDARD =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

/**
 * Standard, padded Base64 — for `data:` URIs.
 *
 * Used to put a decrypted photo thumbnail into an `<Image>` **without writing
 * plaintext to disk**. Every other route to a displayable image goes through a
 * file, and a decrypted photo sitting in the cache directory is exactly the
 * artefact `discardLocalFile` exists to clean up. This keeps it in memory,
 * where the vault's own lock already governs its lifetime.
 *
 * Chunked rather than `out +=` in one loop: a 60 KB thumbnail is 80 000
 * characters, and repeated concatenation of a string that long is where Hermes
 * starts copying on every append.
 */
export function base64Encode(bytes: Uint8Array): string {
  const chunks: string[] = []
  let out = ""
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!
    const b = bytes[i + 1]
    const c = bytes[i + 2]

    out += STANDARD[a >>> 2]!
    out += STANDARD[((a & 0x03) << 4) | ((b ?? 0) >>> 4)]!
    out += b === undefined ? "=" : STANDARD[((b & 0x0f) << 2) | ((c ?? 0) >>> 6)]!
    out += c === undefined ? "=" : STANDARD[c & 0x3f]!

    if (out.length >= 8192) {
      chunks.push(out)
      out = ""
    }
  }
  chunks.push(out)
  return chunks.join("")
}

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
