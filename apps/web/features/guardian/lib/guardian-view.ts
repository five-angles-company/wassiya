import type { LedgerEntry } from "@/components/doc/ledger"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

export type GuardianCaseFacts = {
  duty: "confirm" | "handover" | null
  status: string
  guardianConfirmedAt: number | null
  vetoDeadline: number | null
  submittedAt: number
  /** A `guardian_review` claim with no heir linked cannot be confirmed. */
  heirLinked: boolean
}

export type GuardianView = {
  headline: string
  tone: "settled" | "attention"
  body: string[]
  ask: "confirm" | "handover" | null
  askTitle: string | null
  ledger: LedgerEntry[]
}

/**
 * One claim, from the guardian's side.
 *
 * ## The whole shape, always
 *
 * Every step is listed whatever state the claim is in, which is the point: a
 * guardian arriving cold — months, sometimes years, after they last thought
 * about this — needs to see the shape before the one row that concerns them. A
 * screen showing only the live step asks someone to act on a process they
 * cannot see.
 *
 * ## A finished claim is not a missing one
 *
 * `duty` is `null` for `awaiting_veto`, `vetoed`, `locked` and `closed` — every
 * state where a guardian has nothing to do. An older screen showed "not found"
 * for all of them, so a guardian who confirmed last week and came back to check
 * was told the claim did not exist. The record still renders; the steps are
 * simply all behind them.
 *
 * ## The blocked confirm is named, not hidden
 *
 * `guardianConfirm` throws when no heir is linked. That is said in the headline
 * rather than rendered as a button that fails — and the row stays, because a
 * guardian who was emailed and then finds nothing has been told the app broke.
 */
export function guardianView(
  facts: GuardianCaseFacts,
  locale: Locale
): GuardianView {
  const labels = t(GUARDIAN_DUTIES, locale)
  const common = t(COMMON, locale)

  const confirmed = facts.guardianConfirmedAt !== null
  const released = facts.status === "released"
  const ended =
    facts.status === "vetoed" ||
    facts.status === "locked" ||
    facts.status === "closed"

  const on = (ts: number | null) =>
    ts === null ? undefined : fmtDate(new Date(ts), locale)

  const row = (
    key: string,
    label: string,
    state: LedgerEntry["state"],
    value?: string
  ): LedgerEntry => ({
    key,
    label,
    state,
    value: state === "done" ? (value ?? common.stepDone) : value,
  })

  const blocked = facts.duty === "confirm" && !facts.heirLinked

  const ledger: LedgerEntry[] = [
    row("filed", labels.stepFiled, "done", on(facts.submittedAt)),
    row(
      "confirm",
      labels.stepConfirm,
      confirmed ? "done" : facts.duty === "confirm" ? "now" : "future",
      on(facts.guardianConfirmedAt)
    ),
    row(
      "veto",
      labels.stepVeto,
      released || ended ? "done" : confirmed ? "now" : "future",
      on(facts.vetoDeadline)
    ),
    row(
      "handover",
      labels.stepHandover,
      facts.duty === "handover" ? "now" : "future"
    ),
  ]

  const standing = blocked
    ? { headline: labels.notLinkedBody, tone: "settled" as const, body: [] }
    : facts.duty === "confirm"
      ? { headline: labels.dutyConfirmBody, tone: "attention" as const, body: [] }
      : facts.duty === "handover"
        ? { headline: labels.handoverBody, tone: "attention" as const, body: [] }
        : {
            headline: labels.nothingTitle,
            tone: "settled" as const,
            body: [labels.nothingBody],
          }

  const ask = blocked ? null : facts.duty
  const askTitle =
    ask === "confirm"
      ? labels.stepConfirm
      : ask === "handover"
        ? labels.stepHandover
        : null

  return { ...standing, ask, askTitle, ledger }
}
