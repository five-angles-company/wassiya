/**
 * The recovery leg of the 2-of-3: MK wrapped by K_rec = S_paper ⊕ S_guardian.
 *
 * Both shares are freshly random and neither is derived from MK, so a single
 * share is information-theoretically independent of the master key. The paper
 * share exists only on the printed sheet; the guardian share exists only sealed
 * to the guardian's X25519 key. The server holds the wrapper and nothing else.
 */
import { KEY_BYTES, assertKey, randomBytes, xor } from "./bytes"
import { unwrap, wrap } from "./wrap"

export type RecoveryMaterial = {
  /** Printed on the paper sheet. Never persisted server-side. */
  sPaper: Uint8Array
  /** Sealed to the guardian's public key before it leaves the device. */
  sGuardian: Uint8Array
  /** The only piece the server stores. */
  mkWrappedByRecovery: Uint8Array
}

/** Combine the two shares into K_rec. Not exported: the KEK never leaves here. */
function recoveryKek(sPaper: Uint8Array, sGuardian: Uint8Array): Uint8Array {
  assertKey(sPaper, "sPaper")
  assertKey(sGuardian, "sGuardian")
  return xor(sPaper, sGuardian)
}

/** First-time setup: split MK into a fresh paper share and guardian share. */
export function splitRecovery(mk: Uint8Array): RecoveryMaterial {
  assertKey(mk, "mk")
  const sPaper = randomBytes(KEY_BYTES)
  const sGuardian = randomBytes(KEY_BYTES)
  return {
    sPaper,
    sGuardian,
    mkWrappedByRecovery: wrap(mk, recoveryKek(sPaper, sGuardian)),
  }
}

/**
 * The recovery ceremony: paper sheet in the owner's hand, guardian share
 * decrypted by the guardian and handed over out of band. Throws unless both
 * are the ones the wrapper was built from.
 */
export function recoverMk(
  sPaper: Uint8Array,
  sGuardian: Uint8Array,
  mkWrappedByRecovery: Uint8Array
): Uint8Array {
  return unwrap(mkWrappedByRecovery, recoveryKek(sPaper, sGuardian))
}

/**
 * Reprint the paper sheet: new paper share, guardian share untouched, wrapper
 * rebuilt. The old sheet stops working the moment the new wrapper is saved.
 */
export function rotatePaperShare(
  mk: Uint8Array,
  sGuardian: Uint8Array
): Pick<RecoveryMaterial, "sPaper" | "mkWrappedByRecovery"> {
  assertKey(mk, "mk")
  const sPaper = randomBytes(KEY_BYTES)
  return {
    sPaper,
    mkWrappedByRecovery: wrap(mk, recoveryKek(sPaper, sGuardian)),
  }
}

/**
 * Replace the guardian: new guardian share, paper sheet stays valid, wrapper
 * rebuilt. The outgoing guardian's copy becomes worthless.
 */
export function rotateGuardianShare(
  mk: Uint8Array,
  sPaper: Uint8Array
): Pick<RecoveryMaterial, "sGuardian" | "mkWrappedByRecovery"> {
  assertKey(mk, "mk")
  const sGuardian = randomBytes(KEY_BYTES)
  return {
    sGuardian,
    mkWrappedByRecovery: wrap(mk, recoveryKek(sPaper, sGuardian)),
  }
}
