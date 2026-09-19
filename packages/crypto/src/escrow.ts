/**
 * Locking an heir's K_h to the escrow key.
 *
 * Rules this file encodes — see AGENTS.md "Escrowed release":
 *  - Only the **public** half is ever here. Locking runs on the owner's phone;
 *    the private half lives in a key vault and unlocks server-side at release.
 *  - The caller must check the public key against the pinned fingerprint
 *    (`escrowKeyFingerprint`) before locking. A key accepted from anywhere
 *    else would let whoever supplied it read every K_h.
 *  - The payload embeds ownerId and heirId, and the unlock side must verify
 *    them (`parseUnlockedHeirKey`): a locked key copied onto another heir's
 *    row then fails instead of opening the wrong box.
 *
 * RSA-OAEP with SHA-256 for both the hash and MGF1 and an empty label (RFC
 * 8017 §7.1.1) — the parameters of Cloud KMS `RSA_DECRYPT_OAEP_*_SHA256` and
 * of Node's `privateDecrypt` with `oaepHash: "sha256"`. Implemented with
 * BigInt because React Native has no `crypto.subtle`; encryption needs only
 * the public exponent, so there is no private-key arithmetic to get wrong.
 */
import { sha256 } from "@noble/hashes/sha2.js"

import {
  assertKey,
  bytesToHex,
  bytesToUtf8,
  concatBytes,
  hexToBytes,
  randomBytes,
  utf8ToBytes,
} from "./bytes"

const HASH_BYTES = 32
const PAYLOAD_VERSION = 1
/** Below this the key is refused outright; Cloud KMS keys are 3072 or 4096. */
const MIN_MODULUS_BITS = 3072

export type EscrowPublicKey = { n: bigint; e: bigint; byteLength: number }

export type HeirKeyContext = { ownerId: string; heirId: string }

/**
 * Parse an RSA public key from SubjectPublicKeyInfo — PEM text (what Cloud
 * KMS `getPublicKey` and `openssl` produce) or the DER bytes inside it.
 */
export function parseEscrowPublicKey(
  spki: string | Uint8Array
): EscrowPublicKey {
  const der = typeof spki === "string" ? pemToDer(spki) : spki
  const outer = readDer(der, 0, 0x30)
  const algorithm = readDer(der, outer.start, 0x30)
  const bitString = readDer(der, algorithm.end, 0x03)
  if (der[bitString.start] !== 0) {
    throw new Error("Escrow key: unexpected unused bits")
  }
  const rsa = readDer(der, bitString.start + 1, 0x30)
  const modulus = readDer(der, rsa.start, 0x02)
  const exponent = readDer(der, modulus.end, 0x02)

  const n = bytesToBigInt(der.subarray(modulus.start, modulus.end))
  const e = bytesToBigInt(der.subarray(exponent.start, exponent.end))
  const bits = n.toString(2).length
  if (bits < MIN_MODULUS_BITS) {
    throw new Error(`Escrow key is ${bits} bits; at least ${MIN_MODULUS_BITS} required`)
  }
  return { n, e, byteLength: Math.ceil(bits / 8) }
}

/** SHA-256 of the DER SubjectPublicKeyInfo, hex. What the app pins. */
export function escrowKeyFingerprint(spki: string | Uint8Array): string {
  const der = typeof spki === "string" ? pemToDer(spki) : spki
  return bytesToHex(sha256(der))
}

/** Lock K_h for one heir. Runs on the owner's device. */
export function lockHeirKey(
  context: HeirKeyContext,
  kH: Uint8Array,
  publicKey: EscrowPublicKey
): Uint8Array {
  assertKey(kH, "kH")
  const payload = utf8ToBytes(
    JSON.stringify({
      v: PAYLOAD_VERSION,
      o: context.ownerId,
      h: context.heirId,
      k: bytesToHex(kH),
    })
  )
  return rsaOaepEncrypt(payload, publicKey)
}

/**
 * The unlock side: the key vault returned `plaintext`; accept it only if it
 * was locked for exactly this owner and heir.
 */
export function parseUnlockedHeirKey(
  plaintext: Uint8Array,
  expected: HeirKeyContext
): Uint8Array {
  let parsed: unknown
  try {
    parsed = JSON.parse(bytesToUtf8(plaintext))
  } catch {
    throw new Error("Unlocked heir key is malformed")
  }
  const record = parsed as { v?: unknown; o?: unknown; h?: unknown; k?: unknown }
  if (record.v !== PAYLOAD_VERSION) {
    throw new Error("Unsupported heir key version")
  }
  if (record.o !== expected.ownerId || record.h !== expected.heirId) {
    throw new Error("Heir key was locked for a different heir")
  }
  if (typeof record.k !== "string") {
    throw new Error("Unlocked heir key is malformed")
  }
  return assertKey(hexToBytes(record.k), "kH")
}

// ── RSA-OAEP (RFC 8017 §7.1.1), encryption only ─────────────────────────────

export function rsaOaepEncrypt(
  message: Uint8Array,
  key: EscrowPublicKey
): Uint8Array {
  const k = key.byteLength
  if (message.length > k - 2 * HASH_BYTES - 2) {
    throw new Error("Message too long for the escrow key")
  }
  const lHash = sha256(new Uint8Array(0))
  const padding = new Uint8Array(k - message.length - 2 * HASH_BYTES - 2)
  const db = concatBytes(lHash, padding, Uint8Array.of(1), message)
  const seed = randomBytes(HASH_BYTES)
  const maskedDb = xorInto(db, mgf1(seed, db.length))
  const maskedSeed = xorInto(seed, mgf1(maskedDb, HASH_BYTES))
  const encoded = concatBytes(Uint8Array.of(0), maskedSeed, maskedDb)

  const c = modPow(bytesToBigInt(encoded), key.e, key.n)
  return bigIntToBytes(c, k)
}

function mgf1(seed: Uint8Array, length: number): Uint8Array {
  const out = new Uint8Array(length)
  let offset = 0
  for (let counter = 0; offset < length; counter++) {
    const block = sha256(
      concatBytes(
        seed,
        Uint8Array.of(
          (counter >>> 24) & 0xff,
          (counter >>> 16) & 0xff,
          (counter >>> 8) & 0xff,
          counter & 0xff
        )
      )
    )
    const take = Math.min(block.length, length - offset)
    out.set(block.subarray(0, take), offset)
    offset += take
  }
  return out
}

function xorInto(a: Uint8Array, mask: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length)
  for (let i = 0; i < a.length; i++) out[i] = a[i]! ^ mask[i]!
  return out
}

function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = 1n
  let b = base % modulus
  let e = exponent
  while (e > 0n) {
    if ((e & 1n) === 1n) result = (result * b) % modulus
    e >>= 1n
    b = (b * b) % modulus
  }
  return result
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  return bytes.length === 0 ? 0n : BigInt(`0x${bytesToHex(bytes)}`)
}

function bigIntToBytes(value: bigint, length: number): Uint8Array {
  const hex = value.toString(16).padStart(length * 2, "0")
  if (hex.length > length * 2) throw new Error("Integer too large")
  return hexToBytes(hex)
}

// ── Minimal DER / PEM ───────────────────────────────────────────────────────

function pemToDer(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "")
  const binary = atob(body)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

/** Read one TLV at `offset`, asserting its tag. Returns the value's span. */
function readDer(
  der: Uint8Array,
  offset: number,
  tag: number
): { start: number; end: number } {
  if (der[offset] !== tag) {
    throw new Error(`Escrow key: expected DER tag 0x${tag.toString(16)}`)
  }
  let length = der[offset + 1]
  let start = offset + 2
  if (length === undefined) throw new Error("Escrow key: truncated DER")
  if (length & 0x80) {
    const count = length & 0x7f
    length = 0
    for (let i = 0; i < count; i++) {
      length = length * 256 + (der[start + i] ?? 0)
    }
    start += count
  }
  const end = start + length
  if (end > der.length) throw new Error("Escrow key: truncated DER")
  return { start, end }
}

