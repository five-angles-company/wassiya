import { t, type Locale } from "@/lib/i18n/locale"
import { CLAIMS } from "@/features/claims/strings/claims"

/** The seven statuses, in lifecycle order — the order the filter renders them. */
export const CLAIM_STATUSES = [
  "submitted",
  "guardian_review",
  "awaiting_veto",
  "released",
  "vetoed",
  "locked",
  "closed",
] as const

export type ClaimStatus = (typeof CLAIM_STATUSES)[number]

/**
 * One status, in the same words the claimant is shown for it.
 *
 * The labels come from `apps/web/lib/claim-copy.ts`'s `status*` set, which was
 * written for the claimant's status page and never wired up. Reusing them is
 * what stops an operator and the person they are helping describing the same
 * claim differently.
 *
 * Note `vetoed` and `locked` are **not** given the same label here, even though
 * the claimant's status page currently collapses both into "the owner objected".
 * That collapse is wrong for an operator: a veto is the owner acting, a lock is
 * usually a failed name match, and the two need different follow-ups.
 */
export function claimStatusLabel(status: ClaimStatus, locale: Locale): string {
  const labels = t(CLAIMS, locale)
  const map: Record<ClaimStatus, string> = {
    submitted: labels.statusSubmitted,
    guardian_review: labels.statusGuardianReview,
    awaiting_veto: labels.statusAwaitingVeto,
    released: labels.statusReleased,
    vetoed: labels.statusVetoed,
    locked: labels.statusLocked,
    closed: labels.statusClosed,
  }
  return map[status]
}

/**
 * Whether a status still has a human decision in front of it.
 *
 * Used only for emphasis in the filter. `released`, `vetoed`, `locked` and
 * `closed` are `TERMINAL_STATUSES` in `model/claimFlow.ts`; `awaiting_veto` is
 * waiting on a clock rather than a person, and `guardian_review` is waiting on
 * someone this console cannot reach.
 *
 * Note a `submitted` claim with no vault attached needs a human *more* than an
 * ordinary one — see `admin.unmatchedClaims` — but it is the same status, so
 * that urgency lives on its own screen rather than in this flag.
 */
export function needsAnyone(status: ClaimStatus): boolean {
  return status === "submitted"
}
