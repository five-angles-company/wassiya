import {
  BadgeCheckIcon,
  CircleCheckIcon,
  FileCheckIcon,
  FileTextIcon,
  HourglassIcon,
  InboxIcon,
  MailIcon,
  SearchCheckIcon,
  ShieldOffIcon,
  UserCheckIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

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
export type HeirAsk = "identity" | "certificate" | null

export type HeirView = {
  /** One sentence about the report — never a status name. */
  headline: string
  tone: "settled" | "attention"
  icon: LucideIcon
  /** Paragraphs under the headline. Empty when an `Ask` says it better. */
  body: string[]
  /** A recorded date to show beside the headline — never a countdown. */
  date?: { label: string; value: string }
  ask: HeirAsk
  askTitle: string | null
  ledger: LedgerEntry[]
}

/**
 * A report as a page: where it stands, what is owed, what is on record.
 *
 * A pure function — no hooks, no Convex, no clock, no JSX — so the whole of
 * "what does this reader see" can be read in one place without a browser.
 *
 *  - **The order follows the state machine:** staff review sets the waiting
 *    period's end, and release is when Wassiya contacts the heirs. The reporter
 *    receives nothing by reporting, so there is no box step here.
 *  - **A terminal report has no future.** `vetoed`, `locked` and `closed`
 *    stop the record where they happened; a greyed step is one still awaited.
 *  - **At most one ask.** A grieving reader acts on one thing or none.
 */
export function heirView(facts: HeirCaseFacts, locale: Locale): HeirView {
  const labels = t(CLAIM_STATUS, locale)
  const common = t(COMMON, locale)
  const { status, isMine, identityVerified, certificateReceived } = facts

  const inVeto = status === "awaiting_veto"
  const released = status === "released"
  const ended = status === "vetoed" || status === "locked" || status === "closed"

  const on = (ts: number | null | undefined) =>
    ts === null || ts === undefined ? undefined : fmtDate(new Date(ts), locale)
  const filed = fmtDate(new Date(facts.submittedAt), locale)
  const ends = on(facts.vetoDeadline)

  const row = (
    key: string,
    label: string,
    icon: LucideIcon,
    state: LedgerEntry["state"],
    value?: string
  ): LedgerEntry => ({
    key,
    label,
    icon,
    state,
    value: state === "done" ? (value ?? common.stepDone) : value,
  })

  const paperwork: LedgerEntry[] = [
    row("filed", labels.stepReceived, InboxIcon, "done", filed),
    row("identity", labels.stepIdentity, UserCheckIcon, identityVerified ? "done" : ended ? "future" : "now"),
    row(
      "certificate",
      labels.stepCertificate,
      FileTextIcon,
      certificateReceived ? "done" : !identityVerified || ended ? "future" : "now",
      on(facts.certificateAttachedAt)
    ),
    row(
      "notified",
      labels.stepNotified,
      MailIcon,
      certificateReceived || inVeto || released ? "done" : "future",
      filed
    ),
  ]

  if (ended) {
    const closing =
      status === "vetoed"
        ? { headline: labels.vetoedHeading, body: [labels.vetoedBody, labels.vetoedLockout] }
        : status === "closed"
          ? { headline: labels.closedHeading, body: [labels.closedBody] }
          : { headline: labels.lockedHeading, body: [labels.lockedBody] }

    return { ...closing, tone: "attention", icon: ShieldOffIcon, ask: null, askTitle: null, ledger: paperwork }
  }

  const ledger: LedgerEntry[] = [
    ...paperwork,
    row(
      "review",
      labels.stepReview,
      SearchCheckIcon,
      inVeto || released ? "done" : certificateReceived && identityVerified ? "now" : "future",
      on(facts.reviewedAt)
    ),
    // Undated until review sets the end. An invented date would be the product
    // asserting what it cannot prove.
    row("veto", labels.stepVeto, HourglassIcon, inVeto ? "now" : released ? "done" : "future", ends),
    row("release", labels.stepRelease, UsersIcon, released ? "done" : "future", on(facts.releasedAt)),
  ]

  // An errand belongs only to the person who filed. A forwarded link shows the
  // whole record and asks for nothing — the page offers that reader a way in
  // instead, which is the only thing they can actually do.
  const ask: HeirAsk = !isMine ? null : !identityVerified ? "identity" : !certificateReceived ? "certificate" : null

  const askTitle = ask === "identity" ? labels.stepIdentity : ask === "certificate" ? labels.stepCertificate : null

  const standing: Omit<HeirView, "ask" | "askTitle" | "ledger"> = !identityVerified
    ? { headline: labels.headIdentity, tone: "attention", icon: UserCheckIcon, body: [] }
    : !certificateReceived
      ? { headline: labels.headCertificate, tone: "attention", icon: FileCheckIcon, body: [] }
      : released
        ? { headline: labels.headReleased, tone: "settled", icon: CircleCheckIcon, body: [labels.releasedBody] }
        : inVeto
          ? {
              headline: labels.headVeto,
              tone: "settled",
              icon: HourglassIcon,
              body: [labels.vetoWhy, labels.nothingBody],
              date: ends === undefined ? undefined : { label: labels.vetoEnds, value: ends },
            }
          : { headline: labels.headReview, tone: "settled", icon: BadgeCheckIcon, body: [labels.nothingBody] }

  return { ...standing, ask, askTitle, ledger }
}
