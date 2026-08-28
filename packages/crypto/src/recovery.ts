/**
 * The recovery leg: MK wrapped by K_rec = S_paper. One share, not two.
 *
 * ## Why the guardian is not here
 *
 * This used to be `K_rec = S_paper ⊕ S_guardian` — a 2-of-3. It was removed
 * deliberately, and *storing the guardian half on the server* was rejected as
 * the worse version of the same idea: raw XOR of two 32-byte random values with
 * no KDF means a server holding one half is cryptographically identical to
 * wrapping under the sheet alone, except the server then holds key material it
 * has no need of. Same security, more liability.
 *
 * It also repairs the common case rather than weakening it. `splitRecovery`
 * used to mint both shares at setup, but until a guardian accepted, S_guardian
 * lived only in the owner's own keystore — the very device recovery exists to
 * replace. A guardian-less owner could not recover at all.
 *
 * The guardian keeps their other job: `K_h = S_server_h ⊕ S_guardian_h` in
 * `heir.ts` is untouched. Recovery is 1-of-1; release is still 2-of-2.
 *
 * ## The sheet is a bearer token, so the wrapper is bound
 *
 * With one factor, whoever photographs the sheet can recover the vault. Two
 * things narrow that, and the first lives here: every wrapper is sealed under
 * an AAD naming the owner and the sheet's generation, so a stolen wrapper
 * cannot be replayed against another account or against a sheet that has since
 * been reprinted. (The second is the burn-on-use rotation, which is the
 * *caller's* job — and its ordering matters: see `rotatePaperShare`.)
 */
import { KEY_BYTES, assertKey, randomBytes, utf8ToBytes } from "./bytes"
import { unwrap, wrap } from "./wrap"

export type RecoveryMaterial = {
  /** Printed on the paper sheet. Never persisted server-side. */
  sPaper: Uint8Array
  /** The only piece the server stores. */
  mkWrappedByRecovery: Uint8Array
}

/**
 * The AAD every recovery wrapper is bound to.
 *
 * `v2` is the generation that dropped the guardian share; a v1 wrapper, which
 * carried no AAD at all, therefore cannot be opened by this code even with the
 * right paper share. That is intended — a v1 wrapper needs two shares anyway.
 *
 * **`paperVersion` is the version the wrapper was *built* with.** Unwrapping
 * must recompute this from the version stored alongside the wrapper, never
 * from a counter the client is keeping: get that backwards and every unwrap
 * fails, looking exactly like a wrong sheet.
 *
 * `|` is the delimiter because it cannot occur in a Convex document id, so no
 * pair of (userId, paperVersion) can collide with another.
 */
export function recoveryAad(userId: string, paperVersion: number): Uint8Array {
  return utf8ToBytes(`wassiya/recovery/v2|${userId}|${paperVersion}`)
}

/** First-time setup: mint the paper share and wrap MK under it. */
export function splitRecovery(
  mk: Uint8Array,
  userId: string,
  paperVersion: number
): RecoveryMaterial {
  assertKey(mk, "mk")
  const sPaper = randomBytes(KEY_BYTES)
  return {
    sPaper,
    mkWrappedByRecovery: wrap(
      mk,
      sPaper,
      recoveryAad(userId, paperVersion)
    ),
  }
}

/**
 * The recovery ceremony, now a solitary one: the sheet in the owner's hand and
 * nothing else. Throws unless the share, the owner and the paper version all
 * match the ones the wrapper was built from.
 */
export function recoverMk(
  sPaper: Uint8Array,
  mkWrappedByRecovery: Uint8Array,
  userId: string,
  paperVersion: number
): Uint8Array {
  assertKey(sPaper, "sPaper")
  return unwrap(
    mkWrappedByRecovery,
    sPaper,
    recoveryAad(userId, paperVersion)
  )
}

/**
 * Reprint the sheet: a new paper share, a new version, a rebuilt wrapper.
 *
 * **This function does not invalidate anything — saving its output does.** The
 * old sheet keeps working until `mkWrappedByRecovery` is written, and that is
 * load-bearing rather than incidental. A caller that saves before the owner has
 * seen and acknowledged the new code has turned a theft mitigation into a
 * total-loss bug: the wrapper would then stand under a code printed on no piece
 * of paper, with no guardian left to fall back on. Mint → display → confirm →
 * save, in that order, every time.
 */
export function rotatePaperShare(
  mk: Uint8Array,
  userId: string,
  nextPaperVersion: number
): RecoveryMaterial {
  assertKey(mk, "mk")
  const sPaper = randomBytes(KEY_BYTES)
  return {
    sPaper,
    mkWrappedByRecovery: wrap(
      mk,
      sPaper,
      recoveryAad(userId, nextPaperVersion)
    ),
  }
}
