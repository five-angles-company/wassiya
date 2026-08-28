import { t, type Locale } from "@/lib/i18n/locale"
import { ESCALATION_LABELS } from "@/lib/i18n/strings/escalation"

/** Ladder order, matching `ESCALATION_STATES` in `convex/admin.ts`. */
export const ESCALATION_STATES = [
  "idle",
  "day0",
  "day7",
  "day14",
  "countdown",
] as const

export type EscalationState = (typeof ESCALATION_STATES)[number]

export function escalationLabel(
  state: EscalationState,
  locale: Locale
): string {
  return t(ESCALATION_LABELS, locale)[state]
}

/**
 * Badge tone.
 *
 * `countdown` is destructive because it is the rung where a vault is being
 * handed over — the only one where doing nothing has an irreversible outcome.
 * `idle` reads as settled; the three middle rungs are warnings.
 */
export function escalationVariant(
  state: EscalationState
): "secondary" | "destructive" | "outline" {
  if (state === "idle") return "secondary"
  if (state === "countdown") return "destructive"
  return "outline"
}
