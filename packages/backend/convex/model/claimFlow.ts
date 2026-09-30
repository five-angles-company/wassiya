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

import { v } from "convex/values"

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

/**
 * How long a finished report keeps its death certificate — third-party
 * personal data about someone who cannot consent. A released report keeps it
 * through the delivery year it justified. Both await counsel's sign-off
 * (`apps/landing/src/content/legal/REVIEW-NOTES.md`).
 */
export const CERTIFICATE_KEEP_DAYS = 30
export const RELEASED_CERTIFICATE_KEEP_DAYS = DELIVERY_WINDOW_DAYS + 30

/** When a report that has just ended must lose its certificate. */
export function certificateDeleteAt(status: ClaimStatus, now: number): number {
  const days =
    status === "released"
      ? RELEASED_CERTIFICATE_KEEP_DAYS
      : CERTIFICATE_KEEP_DAYS
  return now + days * DAY_MS
}

/**
 * What a certificate may be: types the review console can display, and never
 * the octet-stream every vault ciphertext is. The web form checks the same
 * list (`certificate-panel.tsx`); only this one is enforced.
 */
export const CERTIFICATE_TYPES: readonly string[] = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
]
export const MAX_CERTIFICATE_BYTES = 20 * 1024 * 1024

/** Tries a reviewer gets at the blind ID-number check, per report. */
export const ID_CHECK_ATTEMPTS = 3

/** Why staff rejected a report. Staff-only — see `claims.rejectReason`. */
export const rejectReasonValidator = v.union(
  v.literal("not_certificate"),
  v.literal("unreadable"),
  v.literal("names_differ")
)

/** Why a verdict cannot be given yet. `null` means it can. */
export type NameMatchBlock = "past-review" | "no-certificate"

/**
 * Whether an admin may record this verdict on this claim right now: once, while
 * it is `submitted` — and an approval only with the death certificate on file,
 * because approving is what starts the road to release. The reporter's own
 * identity is not a condition — they receive nothing, and the certificate, the
 * veto window and each executor's own verification guard everything that
 * matters.
 */
export function nameMatchBlockedReason(
  claim: Doc<"claims">,
  verdict: "approve" | "reject"
): NameMatchBlock | null {
  if (claim.status !== "submitted") return "past-review"
  if (verdict === "approve" && claim.certificateStorageId === undefined) {
    return "no-certificate"
  }
  return null
}
