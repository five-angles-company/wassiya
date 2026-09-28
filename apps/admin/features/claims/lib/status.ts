import { t, type Locale } from "@/lib/i18n/locale"
import { CLAIMS } from "@/features/claims/strings/claims"

/** The seven statuses, in lifecycle order — the order the filter renders them. */
export const CLAIM_STATUSES = [
  "submitted",
  "awaiting_veto",
  "released",
  "vetoed",
  "locked",
  "closed",
] as const

export type ClaimStatus = (typeof CLAIM_STATUSES)[number]

/**
 * One status, for an operator.
 *
 * `vetoed` and `locked` keep separate labels even where the reporter's page
 * says "closed" for both: a veto is the owner acting, a lock is a ruling, and
 * the two need different follow-ups.
 */
export function claimStatusLabel(status: ClaimStatus, locale: Locale): string {
  const labels = t(CLAIMS, locale)
  const map: Record<ClaimStatus, string> = {
    submitted: labels.statusSubmitted,
    awaiting_veto: labels.statusAwaitingVeto,
    released: labels.statusReleased,
    vetoed: labels.statusVetoed,
    locked: labels.statusLocked,
    closed: labels.statusClosed,
  }
  return map[status]
}

/** Mirrors `rejectReasonValidator` in `convex/model/claimFlow.ts`. */
export const REJECT_REASONS = [
  "not_certificate",
  "unreadable",
  "names_differ",
] as const

export type RejectReason = (typeof REJECT_REASONS)[number]

export function rejectReasonLabel(
  reason: RejectReason,
  locale: Locale
): string {
  const labels = t(CLAIMS, locale)
  const map: Record<RejectReason, string> = {
    not_certificate: labels.reasonNotCertificate,
    unreadable: labels.reasonUnreadable,
    names_differ: labels.reasonNamesDiffer,
  }
  return map[reason]
}

/**
 * Whether a status still has a human decision in front of it.
 *
 * Used only for emphasis in the filter. `released`, `vetoed`, `locked` and
 * `closed` are `TERMINAL_STATUSES` in `model/claimFlow.ts`; `awaiting_veto` is
 * waiting on a clock rather than a person.
 *
 * Note a `submitted` claim with no vault attached needs a human *more* than an
 * ordinary one — see `admin.unmatchedClaims` — but it is the same status, so
 * that urgency lives on its own screen rather than in this flag.
 */
export function needsAnyone(status: ClaimStatus): boolean {
  return status === "submitted"
}
