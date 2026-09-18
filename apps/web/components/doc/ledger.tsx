/** One line of the record. */
export type LedgerEntry = {
  key: string
  label: string
  /**
   * The date it happened, where one is recorded — **never guessed**. Not every
   * completed step has a timestamp (a signed-out reader gets fewer still), so a
   * done row with no date carries a word instead. The product does not assert
   * what it cannot prove.
   */
  value?: string
  state: "done" | "now" | "future"
}

import { Paper } from "@/components/doc/paper"

/**
 * What has happened, and what has not, as dated rows on paper.
 *
 * No icons, no bars, no percentage. This is the longest-lived thing on the page
 * — a reader opens it in week three of a thirty-day wait — and a progress
 * indicator that has not moved since their last visit reads as *stuck* rather
 * than as *running correctly*. A dated record reads as a file being kept.
 */
export function Ledger({
  entries,
  nowLabel,
}: {
  entries: LedgerEntry[]
  /** The word marking the row in progress, e.g. "now". */
  nowLabel: string
}) {
  return (
    <Paper>
      <dl className="divide-border divide-y">
        {entries.map((entry) => (
          <div
            key={entry.key}
            className="flex items-baseline justify-between gap-5 px-5 py-3.5"
          >
            <dt
              className={`text-[14.5px] ${
                entry.state === "now"
                  ? "text-surface-accent-ink font-semibold"
                  : entry.state === "future"
                    ? "text-muted-foreground"
                    : ""
              }`}
            >
              {entry.label}
            </dt>
            <dd
              className={`shrink-0 text-[13px] tabular-nums ${
                entry.state === "now"
                  ? "text-surface-accent-ink font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {entry.state === "now" ? nowLabel : (entry.value ?? "")}
            </dd>
          </div>
        ))}
      </dl>
    </Paper>
  )
}
