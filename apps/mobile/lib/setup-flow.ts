/**
 * Where a half-finished onboarding run resumes. Users kill apps, so every screen
 * in ١–٢ must be reachable from a cold start on three pieces of evidence, and no
 * screen may re-run a side effect a previous run already completed.
 *
 *   server  `users.me().identityStatus`  — webhook-written, never client-set
 *   server  `keyring.get()`              — null, or the row and its milestones
 *   device  `readEnrolment()`            — the unauthenticated keystore marker
 *
 * evidence                                            → step            why
 * ─────────────────────────────────────────────────── ──────────────── ──────────────────────────────
 * no session                                           welcome          nothing to resume
 * unverified                                           kyc              the blocking gate, untouched
 * pending                                              kycPending       hosted flow open or in review
 * rejected                                             kyc              retry, or support at 3 failures
 * verified · no keyring · no MK                        explainer        nothing generated yet
 * verified · no keyring · MK                           recoveryKit      MK exists, wrapper never saved
 * verified · keyring · no MK                           recovery         new device, or key invalidated
 * verified · keyring · MK · old wrapper                recoveryKit      re-wrap while MK is still here
 * verified · keyring · MK · not printed                recoveryKit      rotate and reprint
 * verified · keyring · MK · printed                    done             the vault is live
 *
 * `keyring.save` is the hard gate, `markPaperPrinted` is not. "MK exists,
 * wrapper never saved" is the one forbidden resting state and routes forward
 * into the ceremony; an unprinted sheet is a normal state Home re-prompts about
 * and must never lock the app. A keyring row with no local key is never fixable
 * by retrying setup — it is a new device, or one whose keystore invalidated MK —
 * and needs the recovery ceremony.
 *
 * Guards are pure functions of the evidence, mirroring `convex/model/claimFlow.ts`.
 */
/** The subset of `users.me()` that decides routing. */
export type IdentityEvidence =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected"

/** The subset of `keyring.get()` that decides routing. */
export type KeyringEvidence = {
  paperVersion: number
  /** `null` for a pre-AAD wrapper the current code cannot open. */
  wrapperVersion: number | null
  paperPrintedAt: number | null
} | null

/** Kept in step with `RECOVERY_WRAPPER_VERSION` in `@workspace/crypto`. */
const CURRENT_WRAPPER_VERSION = 2

/** The subset of the keystore marker that decides routing. */
export type DeviceEvidence = {
  hasMasterKey: boolean
}

export type SetupEvidence = {
  signedIn: boolean
  identity: IdentityEvidence
  keyring: KeyringEvidence
  device: DeviceEvidence
}

/**
 * Where the run stands. `done` means the tabs; `recovery` means this device
 * cannot continue the setup ceremony and needs the recovery one instead.
 */
export type SetupStep =
  | "welcome"
  | "kyc"
  | "kycPending"
  | "explainer"
  | "recoveryKit"
  | "recovery"
  | "done"

/** The four metered steps of section ٢, in the order the board numbers them. */
export const SETUP_STEP_COUNT = 4

export const SETUP_STEP_INDEX = {
  kyc: 1,
  explainer: 2,
  biometrics: 3,
  recoveryKit: 4,
} as const

/** Failed Didit attempts before the app stops offering a retry. Mirrors
 * `MAX_IDENTITY_ATTEMPTS` on the deployment, which is the enforcing copy. */
export const MAX_IDENTITY_ATTEMPTS = 3

export function resolveSetupStep(evidence: SetupEvidence): SetupStep {
  if (!evidence.signedIn) return "welcome"

  switch (evidence.identity) {
    case "pending":
      return "kycPending"
    case "unverified":
    case "rejected":
      return "kyc"
    case "verified":
      break
  }

  // Verified from here on. The device leg decides the rest.
  if (!evidence.device.hasMasterKey) {
    // No local key. With a keyring row that is a new device; without one the
    // run simply has not reached 2.3 yet.
    return evidence.keyring === null ? "explainer" : "recovery"
  }

  if (evidence.keyring === null) {
    // MK exists but its wrapper was never persisted — the forbidden resting
    // state. Nothing was printed, so re-splitting invalidates nothing.
    return "recoveryKit"
  }

  // A wrapper built by an older construction cannot be opened by this code, so
  // the sheet in the owner's safe is already dead — it just has not been asked
  // yet. Re-wrapping needs MK, which only a device that still holds it has, so
  // this is the *only* window in which it is fixable and it outranks "printed".
  // Left to `paperPrintedAt`, an owner who had printed would route to `done`
  // and never be prompted, and would discover it on the one day they cannot
  // recover from.
  if (evidence.keyring.wrapperVersion !== CURRENT_WRAPPER_VERSION) {
    return "recoveryKit"
  }

  if (evidence.keyring.paperPrintedAt !== null) return "done"

  // An unprinted sheet is reissued. Reissuing used to need `S_guardian` from
  // the keystore to re-derive the wrapper, and a device without it was routed
  // to recovery instead — a dead end for the many owners who never appointed a
  // guardian. K_rec is the sheet alone now, so any device holding MK can mint a
  // fresh sheet, and that whole branch is gone.
  return "recoveryKit"
}

// Note: whether the recovery kit is *reissuing* rather than issuing is
// deliberately NOT decided here. A keyring row means reissue — S_paper was
// discarded when the last sheet rendered, so a new paper version is the only
// honest move — but the screen also has to distinguish "no row" from "the
// query has not answered yet", and this module only sees the settled evidence.
// See `useRecoveryMaterial`, which takes the whole context or `null`.

/** The retry gate on 2.1b. Support handoff replaces "try again" at the cap. */
export function identityRetriesExhausted(attempts: number): boolean {
  return attempts >= MAX_IDENTITY_ATTEMPTS
}
