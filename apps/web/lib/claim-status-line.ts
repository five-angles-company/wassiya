import { t, type Locale } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * A report's state, as a line of text and a tone.
 *
 * ## No badge, and no red
 *
 * This replaced a pill. A coloured chip is a database column wearing a costume,
 * and the column it was wearing — `awaiting_veto` — is not something to hand a
 * reader who has just lost a parent. Status is carried by one line of olive or
 * terracotta, which is the same rule the vault screens follow.
 *
 * `vetoed` and `locked` are deliberately quiet rather than alarmed: they are
 * closed states, not failures, and the palette has no red at all.
 */
const TONE: Record<string, "settled" | "attention" | "quiet"> = {
  released: "attention",
  awaiting_veto: "settled",
  guardian_review: "settled",
  submitted: "attention",
  vetoed: "quiet",
  locked: "quiet",
  closed: "quiet",
}

const LABEL: Record<string, keyof typeof COMMON> = {
  submitted: "statusSubmitted",
  awaiting_veto: "statusAwaitingVeto",
  guardian_review: "statusGuardianReview",
  released: "statusReleased",
  vetoed: "statusVetoed",
  locked: "statusLocked",
  closed: "statusClosed",
}

export function claimStatusLine(
  status: string,
  locale: Locale
): { text: string; tone: "settled" | "attention" | "quiet" } {
  const labels = t(COMMON, locale)
  const key = LABEL[status]

  return {
    // An unmapped status is a backend that grew a state this app has not
    // learned yet. Showing the raw token beats showing nothing: it is
    // diagnosable from a screenshot.
    text: key === undefined ? status : labels[key],
    tone: TONE[status] ?? "quiet",
  }
}
