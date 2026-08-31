"use client"

import type { CSSProperties } from "react"
import Link from "next/link"
import { ArrowRightIcon, type LucideIcon } from "lucide-react"

/**
 * One thing that needs the reader, as a card.
 *
 * ## Why not the row it used to be
 *
 * `ActionRow` is right where a row carries something at both ends — the reports
 * list puts a status pill there, the box list a date. On the home screen the
 * asks have neither, so a full-width bar held a 40px medallion, one line of
 * type, and then eight hundred pixels of nothing before a stranded chevron. The
 * emptiness was not the layout's fault so much as the content's: the row was
 * never given anything to say.
 *
 * So it says something now — every ask carries a sentence explaining what
 * happens if the reader acts — and it sits in a card two to a row, which is a
 * shape that sentence actually fills.
 *
 * ## `tone`
 *
 * `now` is the accent ground and is for asks that are actionable today.
 * `waiting` is the card tone, for an ask that is real but blocked on somebody
 * else — a claim whose heir we have not linked yet, where `guardianConfirm`
 * would throw. Rendering that in the accent would be the app demanding
 * something the reader cannot give.
 */
export function NeedsYouCard({
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
      className={`group rise lift rounded-sheet flex flex-col border p-6 shadow-[var(--shadow-raised)] transition-colors md:p-7 ${
        tone === "now"
          ? "bg-accent text-accent-foreground border-terracotta-200 hover:bg-terracotta-200"
          : "bg-card border-border hover:bg-sand-200"
      }`}
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

      <h3 className="font-heading text-[17px] leading-snug font-extrabold md:text-[18px]">
        {title}
      </h3>
      {meta !== undefined && (
        <p className="ltr-isolate mt-1.5 font-mono text-[12.5px] opacity-60">
          {meta}
        </p>
      )}
      <p
        className={`mt-2.5 flex-1 text-[14px] leading-[1.7] ${
          tone === "now" ? "opacity-80" : "text-muted-foreground"
        }`}
      >
        {body}
      </p>

      <span className="mt-5 inline-flex items-center gap-2 text-[14.5px] font-bold">
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
