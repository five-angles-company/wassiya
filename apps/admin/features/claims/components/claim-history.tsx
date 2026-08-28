"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { CLAIMS } from "@/features/claims/strings/claims"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

/** One audit line, as `admin.claimDetail` returns it. */
export type ClaimHistoryEntry = { event: string; at: number }

/**
 * What has already happened to this claim.
 *
 * The event names are shown raw and LTR — `claim.blocked_by_lockout` rather
 * than a translation of it. Deliberate: this is the audit trail, and a reviewer
 * comparing what the console shows against what the deployment recorded needs
 * the two to be the same string. Prettifying them would mean maintaining a
 * second vocabulary that drifts from the first.
 */
export function ClaimHistory({
  history,
  locale,
}: {
  history: readonly ClaimHistoryEntry[]
  locale: Locale
}) {
  const labels = t(CLAIMS, locale)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">
          {labels.historyTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">{labels.historyEmpty}</p>
        ) : (
          history.map((row, index) => (
            <div
              key={`${row.event}-${index}`}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span dir="ltr" className="inline-block font-mono text-xs">
                {row.event}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {fmtDate(row.at, locale)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
