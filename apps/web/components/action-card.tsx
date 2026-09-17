"use client"

import type { CSSProperties } from "react"
import Link from "next/link"
import { ArrowRightIcon, type LucideIcon } from "lucide-react"

/**
 * One thing that needs the reader, as a card.
 *
 * A card rather than `ActionRow`, which is right only where a row carries
 * something at both ends — a status pill, a date. An *ask* has neither, so the
 * bar held a medallion, one line of type, and eight hundred pixels of nothing
 * before a stranded chevron. Every ask now carries a sentence explaining what
 * happens if the reader acts, and sits two to a row, which is a shape that
 * sentence fills.
 *
 * Shared rather than owned by a feature: the home screen and the guardian's
 * duties list show the same asks.
 *
 * **`tone` tints the mark, never the card** — every card in this app is
 * `--card`. `now` gives the medallion solid terracotta for an ask actionable
 * today; `waiting` leaves it neutral for one blocked on somebody else, like a
 * claim whose heir is unlinked and where `guardianConfirm` would throw.
 */
export function ActionCard({
  href,
  icon: Icon,
  title,
  body,
  action,
  meta,
  tone,
  delay,
}: {
  href: string
  icon: LucideIcon
  title: string
  body: string
  /** The verb at the foot of the card — "راجع", "افتح". */
  action: string
  /** A reference or a name, under the title. */
  meta?: string
  tone: "now" | "waiting"
  delay: number
}) {
  return (
    <Link
      href={href}
      style={{ "--rise-delay": `${delay}ms` } as CSSProperties}
      className="group rise lift bg-card border-border rounded-sheet hover:bg-sand-200 flex flex-col border p-6 shadow-[var(--shadow-raised)] transition-colors md:p-7"
    >
      <span
        aria-hidden
        className={`mb-5 grid size-11 shrink-0 place-items-center rounded-full ${
          tone === "now"
            ? "bg-primary text-primary-foreground shadow-[var(--shadow-raised)]"
            : "bg-background text-muted-foreground"
        }`}
      >
        <Icon className="size-5" strokeWidth={2.2} />
      </span>

      <h3 className="font-heading text-[17px] leading-snug font-extrabold">
        {title}
      </h3>
      {meta !== undefined && (
        <p className="ltr-isolate mt-1.5 font-mono text-[12.5px] opacity-60">
          {meta}
        </p>
      )}
      <p className="text-muted-foreground mt-2.5 flex-1 text-[14px] leading-[1.7]">
        {body}
      </p>

      <span
        className={`mt-5 inline-flex items-center gap-2 text-[14.5px] font-bold ${
          tone === "now" ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {action}
        <ArrowRightIcon
          className="nudge size-4 rtl:-scale-x-100"
          strokeWidth={2.75}
          aria-hidden
        />
      </span>
    </Link>
  )
}
