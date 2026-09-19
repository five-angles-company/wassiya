// The death-report state machine, written out before it is implemented.
//
// state × trigger → next state, with the guard that must hold. A report is
// about the owner; what each heir receives is a `deliveries` row, created by
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
//  submitted        adminSetNameMatch  nameMatch === true AND the reporter    awaiting_veto
//                                      is Didit-verified                      (sets vetoDeadline)
//  submitted        adminSetNameMatch  nameMatch === false                    locked
//  awaiting_veto    veto               caller is the subject; now < deadline  vetoed
//                                                                             (lockedUntil +90d)
//  awaiting_veto    advance            now >= vetoDeadline                    released
//                                                                             (creates deliveries)
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
export function nameMatchOutcome(
  nameMatch: boolean,
  claimantIdentityStatus: Doc<"users">["identityStatus"]
): ClaimStatus {
  return nameMatch && claimantIdentityStatus === "verified"
    ? "awaiting_veto"
    : "locked"
}

/** Days an heir can open a delivery after release, before its key is destroyed. */
export const DELIVERY_WINDOW_DAYS = 365

/** Why a verdict cannot be given yet. `null` means it can. */
export type NameMatchBlock = "past-review" | "identity-not-verified"

/**
 * Whether an admin may record this verdict on this claim right now.
 *
 * Every block applies only to approval: a rejection is *meant* to end in
 * `locked`, so refusing it would refuse the very thing the reviewer is there
 * to do.
 *
 *  - **`identity-not-verified`** — `nameMatchOutcome(true, anything-but-verified)`
 *    returns `locked`, so an admin approving a genuine match while Didit is
 *    still `pending` would destroy the report. It resolves itself: the webhook
 *    lands and the block lifts.
 *
 * ⚠️ `reporterIdentityStatus` must be the LIVE `users.identityStatus`, never
 * `claims.claimantIdentityStatus` — a snapshot taken at submit. A console that
 * disabled its button on the snapshot would disagree with the server in
 * exactly the case this function exists to prevent.
 */
export function nameMatchBlockedReason(
  claim: Doc<"claims">,
  nameMatch: boolean,
  reporterIdentityStatus: Doc<"users">["identityStatus"]
): NameMatchBlock | null {
  if (claim.status !== "submitted") return "past-review"
  if (!nameMatch) return null
  if (reporterIdentityStatus !== "verified") return "identity-not-verified"
  return null
}
