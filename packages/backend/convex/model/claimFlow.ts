// The death-report state machine, written out before it is implemented.
//
// state × trigger → next state, with the guard that must hold. A report is
// about the owner; what each executor receives is a `deliveries` row, created by
// `advance` when a report reaches `released`. The release action re-reads both
// and re-checks everything itself rather than trusting whoever called it.
//
//  from             trigger            guard                                  to
//  ───────────────  ─────────────────  ─────────────────────────────────────  ───────────────
//  (none)           submit             reporter authenticated; no lockout     submitted
//  (none)           submit             reporter inside a 90-day lockout       locked
//  submitted        adminLinkSubject   admin attaches the vault a typo'd      submitted
//                                      address missed                         (gains subjectUserId)
//  submitted        sweepUnmatched     no subjectUserId, older than the       closed
//                                      grace window                           (no_vault_matched)
//  submitted        adminCloseClaim    admin ends it without a verdict        closed
//  submitted        adminSetNameMatch  nameMatch === true                     awaiting_veto
//                                                                             (sets vetoDeadline)
//  submitted        adminSetNameMatch  nameMatch === false                    locked
//  submitted or     checkin.confirm    the subject confirms alive with a      vetoed
//  awaiting_veto                       fingerprint; before the deadline       (lockedUntil +90d)
//  awaiting_veto    advance            now >= vetoDeadline                    released
//                                                                             (creates deliveries,
//                                                                             closes the vault)
//  vetoed           —                  terminal                               —
//  locked           —                  terminal                               —
//  released         —                  terminal                               —
//  closed           —                  terminal                               —
//
// A claim with no `subjectUserId` matched no vault. It sits in `submitted`
// exactly like a matched one, and `adminSetNameMatch` refuses it, so it can
// only leave by being linked to a vault or closed.
//
// A lockout expiring does NOT reopen the old claim: the reporter submits a new
// one. An owner who vetoes has proved they were alive *then*, which is not
// evidence about later — so a permanent bar would be the wrong default.

import type { Doc } from "../_generated/dataModel"

export const DAY_MS = 24 * 60 * 60 * 1000

/** Days between staff approval of a report and automatic release. */
export const VETO_WINDOW_DAYS = 30

/** How long an owner's veto bars that claimant from filing again. */
export const VETO_LOCKOUT_DAYS = 90

/**
 * Ceiling on claims one account may file in a rolling 24 hours.
 *
 * This only began to mean anything when `submit` started inserting a row for
 * an address that matched no vault. It counts rows, so while a miss wrote
 * nothing, probing for vaults that do not exist cost nothing and was unbounded.
 */
export const CLAIM_RATE_LIMIT = 3
export const CLAIM_RATE_WINDOW_MS = DAY_MS

export type ClaimStatus = Doc<"claims">["status"]

export const TERMINAL_STATUSES: readonly ClaimStatus[] = [
  "vetoed",
  "locked",
  "released",
  "closed",
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
export function nameMatchOutcome(nameMatch: boolean): ClaimStatus {
  return nameMatch ? "awaiting_veto" : "locked"
}

/** Days an executor can open a delivery after release, before the vault is deleted. */
export const DELIVERY_WINDOW_DAYS = 365

/** Why a verdict cannot be given yet. `null` means it can. */
export type NameMatchBlock = "past-review"

/**
 * Whether an admin may record a verdict on this claim right now: once, while it
 * is `submitted`. The reporter's own identity is not a condition — they
 * receive nothing, and the certificate, the veto window and each executor's own
 * verification guard everything that matters.
 */
export function nameMatchBlockedReason(
  claim: Doc<"claims">
): NameMatchBlock | null {
  return claim.status === "submitted" ? null : "past-review"
}
