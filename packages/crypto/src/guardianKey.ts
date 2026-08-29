/**
 * The guardian's key sheet: their X25519 secret, printed.
 *
 * A guardian holds one thing, `S_guardian_h`'s opener — the private half of the
 * key the owner seals every heir share to. Without it an heir's box cannot be
 * opened, and nobody can reissue it: `guardians.accept` needs an unexpired
 * invitation, which needs a living owner. By the time the key is wanted, the
 * owner is dead.
 *
 * ## Why the sheet *is* the key, and not a wrapper for one
 *
 * The owner keeps MK in a hardware keystore and the sheet is a second way in.
 * A guardian has no keystore — they are on the web, deliberately, because
 * accepting on mobile would mint this secret into a keystore the web app can
 * never reach. So there is no "daily" copy for a sheet to back up; there is
 * only the sheet.
 *
 * Storing a wrapped copy server-side would buy the ability to add a second
 * unlock method later, at the cost of a blob, an AAD, and a version pair that
 * can tear — which this repo has already paid for once, and which is why
 * `keyring.wrapperVersion` exists. For a key used once in a decade that trade
 * is not worth making. The server keeps the public half and nothing else.
 *
 * Convenience is a *local* concern instead: a browser may cache the secret
 * behind a passkey, and losing that cache must be survivable, because the sheet
 * is the home.
 *
 * ## Versioned from the first line
 *
 * `GUARDIAN_SHEET_VERSION` is in the code and inside the checksummed payload
 * from day one. The keyring learned that lesson expensively — a construction
 * that cannot say which construction it is breaks silently, on the one day
 * nobody can afford it.
 */
import { assertBytes } from "./bytes"
import {
  X25519_KEY_BYTES,
  generateGuardianKeypair,
  guardianPublicKey,
} from "./guardian"
import {
  GUARDIAN_CODE_FORMAT,
  decodeSecretCode,
  encodeSecretCode,
} from "./papercode"

/** Bump together with any change to what the printed code carries. */
export const GUARDIAN_SHEET_VERSION = 1

export type GuardianKeySheet = {
  /**
   * Published to the owner through `guardians.accept`. Safe to store.
   */
  publicKey: Uint8Array
  /**
   * The secret, for the caller to cache locally if it wants to. **Zero it**
   * once cached — the printed code is the copy that lasts.
   */
  secretKey: Uint8Array
  /** What goes on the sheet. The only durable copy of `secretKey`. */
  code: string
  version: number
}

/**
 * Generate a guardian's keypair and render the printable code for it.
 *
 * Minting is deliberately separate from accepting. Nothing here touches the
 * server, so a caller can — and must — show this code and have the guardian
 * confirm it *before* `guardians.accept` consumes the invitation. Accepting
 * first would publish a public key whose private half nobody has: the owner's
 * protection score would turn green, bundles would be sealed to it, and the
 * failure would surface only at the release ceremony.
 */
export function mintGuardianKeySheet(
  version: number = GUARDIAN_SHEET_VERSION
): GuardianKeySheet {
  const { secretKey, publicKey } = generateGuardianKeypair()
  return {
    publicKey,
    secretKey,
    code: encodeSecretCode(GUARDIAN_CODE_FORMAT, secretKey, version),
    version,
  }
}

export function encodeGuardianKey(
  secretKey: Uint8Array,
  version: number = GUARDIAN_SHEET_VERSION
): string {
  assertBytes(secretKey, X25519_KEY_BYTES, "guardian secret key")
  return encodeSecretCode(GUARDIAN_CODE_FORMAT, secretKey, version)
}

export type DecodedGuardianKey = { secretKey: Uint8Array; version: number }

/**
 * Read a typed-in key sheet.
 *
 * Throws for a mistyped character, a wrong length, a version that disagrees
 * with its prefix — and for an owner's *recovery* sheet, which fails the
 * checksum because the two formats are domain-separated inside it. The message
 * never quotes a character: this string is key material.
 */
export function decodeGuardianKey(code: string): DecodedGuardianKey {
  const { secret, version } = decodeSecretCode(GUARDIAN_CODE_FORMAT, code)
  return { secretKey: secret, version }
}

/**
 * Does this code open what the owner sealed to?
 *
 * The confirm step's check — a guardian who has just written the code down can
 * be asked to type it back, and this proves the two agree before the invitation
 * is spent. It is also the whole of the periodic key check: the same question,
 * asked years later, while the owner is still alive to issue a new invitation
 * if the answer is no.
 *
 * Compares the derived public key rather than the secret, so a caller can run
 * it against the row the server already holds without ever sending anything.
 */
export function guardianKeyMatches(
  code: string,
  expectedPublicKey: Uint8Array
): boolean {
  assertBytes(expectedPublicKey, X25519_KEY_BYTES, "expectedPublicKey")
  let secretKey: Uint8Array | undefined
  try {
    secretKey = decodeGuardianKey(code).secretKey
    const derived = guardianPublicKey(secretKey)
    let same = 0
    for (let i = 0; i < X25519_KEY_BYTES; i++) {
      same |= derived[i]! ^ expectedPublicKey[i]!
    }
    return same === 0
  } catch {
    // A code that does not parse is a code that does not match. The caller
    // wants "is this the right sheet?", not a taxonomy of how it was wrong.
    return false
  } finally {
    secretKey?.fill(0)
  }
}
