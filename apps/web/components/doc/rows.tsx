import Link from "next/link"
import { ChevronLeftIcon } from "lucide-react"

import { Paper } from "@/components/doc/paper"

/**
 * A list of things, as rows on one sheet of paper.
 *
 * One frame around the set, not one per row. Every row is the same kind of
 * object, so a card each drew six identical boxes and left the reader to find
 * the difference inside them — and on a phone most of the width went to
 * padding.
 */
export function Rows({ children }: { children: React.ReactNode }) {
  return (
    <Paper>
      <div className="divide-border divide-y">{children}</div>
    </Paper>
  )
}

/**
 * One row: what it is, and one line of where it stands.
 *
 * The chevron points along the reading direction — `ltr:` is the exception
 * here, because Arabic is the default and English is the case that rotates.
 */
export function RowLink({
  href,
  title,
  status,
  tone,
  meta,
}: {
  href: string
  title: string
  status: string
  tone: "settled" | "attention" | "quiet"
  /** Provenance — a date, a reference. Never the status. */
  meta?: string
}) {
  return (
    <Link
      href={href}
      className="group hover:bg-surface-accent-soft/40 flex items-start gap-4 px-5 py-4 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="font-heading text-[16.5px] leading-tight font-bold">
          {title}
        </p>
        <p
          className={`mt-1.5 text-[14px] font-semibold ${
            tone === "attention"
              ? "text-tone-attention"
              : tone === "settled"
                ? "text-tone-settled"
                : "text-muted-foreground"
          }`}
        >
          {status}
        </p>
        {meta !== undefined && (
          <p className="text-muted-foreground mt-1 text-[12.5px]">{meta}</p>
        )}
      </div>

      <ChevronLeftIcon
        aria-hidden
        className="nudge mt-1 size-4 shrink-0 opacity-40 ltr:rotate-180"
        strokeWidth={2.6}
      />
    </Link>
  )
}
