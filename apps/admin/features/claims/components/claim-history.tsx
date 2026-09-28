"use client"

import type { ClaimDetail } from "@/features/claims/lib/detail"
import { CLAIMS } from "@/features/claims/strings/claims"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

type Entry = ClaimDetail["history"][number]

/**
 * What has happened to this report, oldest first, one line each. The raw
 * event names stay in the audit log, where they can be matched verbatim.
 */
export function ClaimHistory({
  history,
  locale,
}: {
  history: ClaimDetail["history"]
  locale: Locale
}) {
  const labels = t(CLAIMS, locale)
  const oldestFirst = [...history].reverse()

  return oldestFirst.length === 0 ? (
    <span className="text-muted-foreground">{labels.historyEmpty}</span>
  ) : (
    <ol className="flex flex-col gap-1">
      {oldestFirst.map((row, index) => (
        <li key={`${row.event}-${row.at}-${index}`}>
          {eventLabel(row, locale)}
          <span className="text-muted-foreground">
            {row.actor !== null && (
              <>
                {" · "}
                <bdi>{row.actor}</bdi>
              </>
            )}
            {" · "}
            {fmtDate(row.at, locale)}
          </span>
        </li>
      ))}
    </ol>
  )
}

function eventLabel(row: Entry, locale: Locale): string {
  const labels = t(CLAIMS, locale)
  switch (row.event) {
    case "claim.submitted":
      return labels.eventSubmitted
    case "claim.blocked_by_lockout":
      return labels.eventBlocked
    case "claim.certificate_attached":
      return labels.eventCertificate
    case "claim.subject_linked":
      return labels.eventLinked
    case "claim.name_match_set":
      return row.outcome === false ? labels.eventRejected : labels.eventApproved
    case "claim.id_checked":
      return row.outcome === true
        ? labels.eventIdMatched
        : labels.eventIdMismatch
    case "claim.vetoed":
      return labels.eventVetoed
    case "claim.closed":
      return labels.eventClosed
    case "claim.released":
      return labels.eventReleased
    default:
      return row.event
  }
}
