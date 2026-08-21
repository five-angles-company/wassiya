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
