import type { LedgerEntry } from "@/components/doc/ledger"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { CLAIM_STATUS } from "@/features/claims/strings/claim-status"

/** What the page knows about the claim, from whichever query could read it. */
export type HeirCaseFacts = {
  status: string
  submittedAt: number
  vetoDeadline: number | null
  certificateReceived: boolean
  guardianConfirmed: boolean
  /**
   * ⚠️ The **live** value, never `claim.claimantIdentityStatus`.
   *
   * That column is a snapshot taken at submit and refreshed only as a side
   * effect of an admin's verdict. Someone who files and then verifies sits
   * between the two — and branching on the snapshot asks them for an identity
   * check that is already done, with the certificate step never appearing
   * behind it. `model/claimFlow.ts` states the same rule for the server side.
   */
  identityVerified: boolean
  /** False for a signed-out reader, and for a relative who was forwarded the link. */
  isMine: boolean
  /** Absent on the public read, which carries fewer dates than the claimant's. */
  certificateAttachedAt?: number | null
  reviewedAt?: number | null
  releasedAt?: number | null
}

/** Which errand the reader owes. `null` is the commonest answer by far. */
export type HeirAsk = "identity" | "certificate" | "box" | null

export type HeirView = {
  /** One sentence about the report — never a status name. */
  headline: string
  tone: "settled" | "attention"
  /** Paragraphs under the headline. Empty when an `Ask` says it better. */
  body: string[]
  ask: HeirAsk
  askTitle: string | null
  ledger: LedgerEntry[]
}

/**
 * The heir's report as a page: where it stands, what is owed, what is on record.
 *
 * A pure function — no hooks, no Convex, no clock, no JSX — so the whole of
 * "what does this reader see, and where are they" can be read in one place and
 * reasoned about without a browser.
 *
 * ## The order follows the state machine
 *
 * The guardian confirms **before** the objection period, because
 * `guardianConfirm` requires `guardian_review` and sets `vetoDeadline` in the
 * same mutation. Their confirmation is not something that happens after the
 * wait; it is what starts it.
 *
 * ## A terminal report has no future
 *
 * `vetoed`, `locked` and `closed` stop the record where they happened rather
 * than listing three steps that will never run. A step shown greyed out is a
 * step the reader is still waiting for.
 *
 * ## At most one ask
 *
 * A reader who is grieving will act on one thing or none. Everything not
 * currently owed is a row in the record.
 */
export function heirView(facts: HeirCaseFacts, locale: Locale): HeirView {
  const labels = t(CLAIM_STATUS, locale)
  const common = t(COMMON, locale)
  const { status, isMine, identityVerified, certificateReceived } = facts

  const inGuardian = status === "guardian_review"
  const inVeto = status === "awaiting_veto"
  const released = status === "released"
  const ended =
    status === "vetoed" || status === "locked" || status === "closed"

  const on = (ts: number | null | undefined) =>
    ts === null || ts === undefined ? undefined : fmtDate(new Date(ts), locale)
  const filed = fmtDate(new Date(facts.submittedAt), locale)
  const ends = on(facts.vetoDeadline)

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

  const paperwork: LedgerEntry[] = [
    row("filed", labels.stepReceived, "done", filed),
    row(
      "identity",
      labels.stepIdentity,
      identityVerified ? "done" : ended ? "future" : "now"
    ),
    row(
      "certificate",
      labels.stepCertificate,
      certificateReceived
        ? "done"
        : !identityVerified || ended
          ? "future"
          : "now",
      on(facts.certificateAttachedAt)
    ),
    row(
      "notified",
      labels.stepNotified,
      certificateReceived || inGuardian || inVeto || released
        ? "done"
        : "future",
      filed
    ),
  ]

  if (ended) {
    const closing =
      status === "vetoed"
        ? {
            headline: labels.vetoedHeading,
            body: [labels.vetoedBody, labels.vetoedLockout],
          }
        : status === "closed"
          ? { headline: labels.closedHeading, body: [labels.closedBody] }
          : { headline: labels.lockedHeading, body: [labels.lockedBody] }

    return {
      ...closing,
      tone: "attention",
      ask: null,
      askTitle: null,
      ledger: paperwork,
    }
  }

  const ledger: LedgerEntry[] = [
    ...paperwork,
    row(
      "guardian",
      labels.stepGuardian,
      facts.guardianConfirmed ? "done" : inGuardian ? "now" : "future",
      on(facts.reviewedAt)
    ),
    // Undated until the guardian confirms, because until then there is no
    // deadline. An invented one would be the product asserting what it cannot
    // prove.
    row(
      "veto",
      labels.stepVeto,
      inVeto ? "now" : released ? "done" : "future",
      ends
    ),
    // One row, not two. Getting the guardian's half and opening the box are a
    // prerequisite and its action, and splitting them marks two rows at once —
    // which reads as two things owed, by a reader who owes exactly one.
    row(
      "box",
      labels.stepRelease,
      released ? "now" : "future",
      on(facts.releasedAt)
    ),
  ]

  // An errand belongs only to the person who filed. A forwarded link shows the
  // whole record and asks for nothing — the page offers that reader a way in
  // instead, which is the only thing they can actually do.
  const ask: HeirAsk = !isMine
    ? null
    : !identityVerified
      ? "identity"
      : !certificateReceived
        ? "certificate"
        : released
          ? "box"
          : null

  const askTitle =
    ask === "identity"
      ? labels.stepIdentity
      : ask === "certificate"
        ? labels.stepCertificate
        : ask === "box"
          ? labels.stepRelease
          : null

  const standing = !identityVerified
    ? { headline: labels.headIdentity, tone: "attention" as const, body: [] }
    : !certificateReceived
      ? {
          headline: labels.headCertificate,
          tone: "attention" as const,
          body: [],
        }
      : released
        ? { headline: labels.headReleased, tone: "attention" as const, body: [] }
        : inVeto
          ? {
              headline: labels.headVeto,
              tone: "settled" as const,
              body:
                ends === undefined
                  ? [labels.nothingBody]
                  : [labels.writeOn.replace("{date}", ends), labels.nothingBody],
            }
          : {
              headline: labels.headGuardian,
              tone: "settled" as const,
              body: [labels.nothingBody],
            }

  return { ...standing, ask, askTitle, ledger }
}
