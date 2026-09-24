import type { LucideIcon } from "lucide-react"
import { CheckIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { Paper } from "@/components/doc/paper"

/** One step of the record. */
export type LedgerEntry = {
  key: string
  label: string
  /**
   * The date it happened, where one is recorded — **never guessed**. Not every
   * completed step has a timestamp (a signed-out reader gets fewer still), so a
   * done step with no date shows nothing there. The product does not assert
   * what it cannot prove.
   */
  value?: string
  state: "done" | "now" | "future"
  icon?: LucideIcon
}

/**
 * What has happened and what has not, as a vertical timeline.
 *
 * ⚠️ No percentage, no progress bar, nothing that moves on its own. A reader
 * opens this in week three of a thirty-day wait; a bar that has not moved since
 * their last visit reads as *stuck*, where dated steps read as a file being
 * kept.
 */
export function Ledger({
  entries,
  nowLabel,
  title,
}: {
  entries: LedgerEntry[]
  /** The word marking the step in progress, e.g. "now". */
  nowLabel: string
  title?: string
}) {
  return (
    <Paper padded className="rise-in">
      {title !== undefined && <h2 className="font-heading mb-5 text-[20px] leading-snug font-extrabold">{title}</h2>}
      <ol className="relative">
        <span aria-hidden className="bg-border absolute start-[17px] top-5 bottom-5 w-0.5" />
        {entries.map((entry) => {
          const Icon = entry.state === "done" ? CheckIcon : entry.icon
          return (
            <li key={entry.key} className="relative flex items-center gap-4 py-2.5">
              <span
                aria-hidden
                className={cn(
                  "ring-card relative flex size-9 shrink-0 items-center justify-center rounded-full ring-4",
                  entry.state === "done" && "bg-tone-settled-soft text-tone-settled",
                  entry.state === "now" && "bg-primary text-primary-foreground",
                  entry.state === "future" && "bg-muted text-muted-foreground"
                )}
              >
                {Icon !== undefined ? (
                  <Icon className="size-[17px]" strokeWidth={entry.state === "done" ? 3 : 2.25} />
                ) : (
                  <span className="size-2 rounded-full bg-current" />
                )}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 text-[15.5px]",
                  entry.state === "now" && "font-bold",
                  entry.state === "done" && "font-semibold",
                  entry.state === "future" && "text-muted-foreground"
                )}
              >
                {entry.label}
              </span>
              <span
                className={cn(
                  "shrink-0 text-[13.5px] tabular-nums",
                  entry.state === "now" ? "text-surface-accent-ink font-semibold" : "text-muted-foreground"
                )}
              >
                {entry.state === "now" ? nowLabel : (entry.value ?? "")}
              </span>
            </li>
          )
        })}
      </ol>
    </Paper>
  )
}
