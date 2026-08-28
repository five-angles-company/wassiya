import { t, type Locale } from "@/lib/i18n/locale"
import { GUARDIAN_STATE_LABELS } from "@/lib/i18n/strings/guardian-state"

/**
 * The five states a guardian appointment can be in, in lifecycle order.
 *
 * Derived server-side in `admin.guardiansList` from `status`,
 * `inviteExpiresAt` and whether a public key was published — see there for why
 * the raw status is not enough on its own.
 */
export const GUARDIAN_STATES = [
  "invited",
  "expired",
  "accepted",
  "live",
  "revoked",
] as const

export type GuardianState = (typeof GUARDIAN_STATES)[number]

export function guardianStateLabel(
  state: GuardianState,
  locale: Locale
): string {
  const labels = t(GUARDIAN_STATE_LABELS, locale)
  const map: Record<GuardianState, string> = {
    live: labels.stateLive,
    accepted: labels.stateAccepted,
    invited: labels.stateInvited,
    expired: labels.stateExpired,
    revoked: labels.stateRevoked,
  }
  return map[state]
}

/**
 * Badge tone. Only `live` is settled; `expired` is the one that costs an owner
 * something, so it is the only one that reads as an error.
 */
export function guardianStateVariant(
  state: GuardianState
): "secondary" | "destructive" | "outline" {
  if (state === "live") return "secondary"
  if (state === "expired") return "destructive"
  return "outline"
}
