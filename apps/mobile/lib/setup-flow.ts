/**
 * Where a half-finished onboarding run resumes, written out before it is used.
 *
 * Users kill apps. Every screen in sections ١–٢ therefore has to be reachable
 * from a cold start with nothing but three pieces of evidence, and no screen
 * may re-run a side effect a previous run already completed. The evidence:
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
 * verified · keyring · MK · no S_guardian              recovery         cannot rotate; same as no MK
 * verified · keyring · MK · not printed                recoveryKit      rotate and reprint
 * verified · keyring · MK · printed                    done             the vault is live
 *
 * Two rules the table encodes and nothing may soften:
 *
 *  - **`keyring.save` is the hard gate, `markPaperPrinted` is not.** Row
 *    "MK exists, wrapper never saved" is the one forbidden resting state — 2.3b
 *    says the run is not safe to abandon there — so it routes forward into the
 *    ceremony rather than to the tabs. An unprinted sheet, by contrast, is a
 *    normal state the Home screen re-prompts about; it must never lock the app.
 *
 *  - **A keyring row with no local key is not recoverable by retrying.** It is
 *    a new device, or one whose keystore invalidated MK when its biometrics
 *    changed. Both need the recovery ceremony, not the setup ceremony.
 *
 * Guards are pure functions of the evidence so they can be reasoned about
 * without a device, mirroring `convex/model/claimFlow.ts`.
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
  paperPrintedAt: number | null
} | null

/** The subset of the keystore marker that decides routing. */
export type DeviceEvidence = {
  hasMasterKey: boolean
  hasGuardianShare: boolean
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

  if (evidence.keyring.paperPrintedAt !== null) return "done"

  // An unprinted sheet has to be reissued, and reissuing needs S_guardian to
  // re-derive the wrapper. Without it this device can no longer rotate.
  return evidence.device.hasGuardianShare ? "recoveryKit" : "recovery"
}

// Note: whether the recovery kit is *reissuing* rather than issuing is
// deliberately NOT decided here. A keyring row means reissue — S_paper was
// discarded when the last sheet rendered, so a new paper version is the only
// honest move — but the screen also has to distinguish "no row" from "the
// query has not answered yet", and this module only sees the settled evidence.
// See `useRecoveryMaterial`, which takes the loaded flag explicitly.

/** The retry gate on 2.1b. Support handoff replaces "try again" at the cap. */
export function identityRetriesExhausted(attempts: number): boolean {
  return attempts >= MAX_IDENTITY_ATTEMPTS
}
