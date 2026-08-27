// The death-claim state machine, written out before it is implemented.
//
// state × trigger → next state, with the guard that must hold. Nothing in
// `claims.ts` may move a claim except through `nextStatus` below, and
// `release.releasedBundleForHeir` re-reads the row and re-checks "released"
// itself rather than trusting whoever called it.
//
//  from             trigger            guard                                  to
//  ───────────────  ─────────────────  ─────────────────────────────────────  ───────────────
//  (none)           submit             claimant authenticated; no lockout     submitted
//  (none)           submit             claimant inside a 90-day lockout       locked
//  submitted        adminSetNameMatch  nameMatch === true AND the claimant    guardian_review
//                                      is Didit-verified
//  submitted        adminSetNameMatch  nameMatch === false                    locked
//  guardian_review  guardianConfirm    caller is the subject's accepted       awaiting_veto
//                                      guardian; heirId linked                (sets vetoDeadline)
//  awaiting_veto    veto               caller is the subject; now < deadline  vetoed
//                                                                             (lockedUntil +90d)
//  awaiting_veto    advance            now >= vetoDeadline                    released
//  vetoed           —                  terminal                               —
//  locked           —                  terminal                               —
//  released         —                  terminal                               —
//
// A lockout expiring does NOT reopen the old claim: the claimant submits a new
// one. An owner who vetoes has proved they were alive *then*, which is not
// evidence about later — so a permanent bar would be the wrong default.

import type { Doc } from "../_generated/dataModel"

export const DAY_MS = 24 * 60 * 60 * 1000

/** Days between the guardian's confirmation and automatic release. */
export const VETO_WINDOW_DAYS = 30

/** How long an owner's veto bars that claimant from filing again. */
export const VETO_LOCKOUT_DAYS = 90

/** Ceiling on claims one account may file in a rolling 24 hours. */
export const CLAIM_RATE_LIMIT = 3
export const CLAIM_RATE_WINDOW_MS = DAY_MS

export type ClaimStatus = Doc<"claims">["status"]

export const TERMINAL_STATUSES: readonly ClaimStatus[] = [
  "vetoed",
  "locked",
  "released",
]

export function isTerminal(status: ClaimStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

/**
 * Is this claimant currently barred from filing against this subject? A veto
 * sets `lockedUntil`; once it has passed the bar lifts.
 */
export function isLockedOut(claim: Doc<"claims">, now: number): boolean {
  return claim.lockedUntil !== undefined && claim.lockedUntil > now
}

/** The single guard for automatic release. Time, and nothing else, decides it. */
export function vetoWindowElapsed(claim: Doc<"claims">, now: number): boolean {
  return (
    claim.status === "awaiting_veto" &&
    claim.vetoDeadline !== undefined &&
    claim.vetoDeadline <= now
  )
}

/** Where an admin's name-match verdict sends a submitted claim. */
export function nameMatchOutcome(
  nameMatch: boolean,
  claimantIdentityStatus: Doc<"users">["identityStatus"]
): ClaimStatus {
  return nameMatch && claimantIdentityStatus === "verified"
    ? "guardian_review"
    : "locked"
}

/** Why a verdict cannot be given yet. `null` means it can. */
export type NameMatchBlock =
  | "past-review"
  | "no-heir"
  | "identity-not-verified"

/**
 * Whether an admin may record this verdict on this claim right now.
 *
 * `nameMatchOutcome` above says where a verdict *sends* a claim; this says
 * whether it may be given at all. The two belong together because the second
 * exists entirely to stop the first producing an outcome nobody intended.
 *
 * ## Both blocks apply only to approval, and that asymmetry is the point
 *
 * A rejection is *meant* to end in `locked`. Refusing to reject a claim because
 * its claimant is unverified would be refusing the very thing the reviewer is
 * there to do. Only `nameMatch === true` needs protecting, because approval is
 * the one case where what the admin intends and what the code produces come
 * apart:
 *
 *  - **`identity-not-verified`** — `nameMatchOutcome(true, anything-but-verified)`
 *    returns `locked`. An admin looking at a genuine match, while Didit happens
 *    still to be `pending`, destroys the claim by approving it. Nothing moves a
 *    claim out of `locked`; the remedy is for the claimant to file again.
 *  - **`no-heir`** — approving with no `heirId` sends the claim to
 *    `guardian_review`, where `guardianConfirm` throws "not linked to an heir
 *    record yet". `adminLinkHeir` can still repair it, so it is recoverable —
 *    but only by an admin who can still *find* the claim, and until
 *    `admin.claimsByStatus` existed no admin query could.
 *
 * ## `claimantIdentityStatus` must be the LIVE value
 *
 * Pass `users.identityStatus` read now — never `claims.claimantIdentityStatus`,
 * which is a snapshot taken at submit and refreshed only as a side effect of
 * `adminSetNameMatch` itself. `adminSetNameMatch` decides on the live value, so
 * a UI that disabled its button on the stored one would disagree with the server
 * in exactly the case this function exists to prevent.
 */
export function nameMatchBlockedReason(
  claim: Doc<"claims">,
  nameMatch: boolean,
  claimantIdentityStatus: Doc<"users">["identityStatus"]
): NameMatchBlock | null {
  if (claim.status !== "submitted") return "past-review"
  if (!nameMatch) return null
  if (claim.heirId === undefined) return "no-heir"
  if (claimantIdentityStatus !== "verified") return "identity-not-verified"
  return null
}
