"use client"

import type { CSSProperties } from "react"
import Link from "next/link"
import { ArrowRightIcon, type LucideIcon } from "lucide-react"

/**
 * A place to go, with a count — not a thing to do.
 *
 * These were the same full-width rows as the asks above them, which said the
 * four items were one list of four equal things. They are not: two of them
 * needed the reader today and two are just doors with a number on.
 *
 * So the shape is different and deliberately smaller — a compact tile with the
 * figure carrying the weight instead of the label. The number sits in the
 * heading face and `tabular-nums`, because these are read as a pair and lining
 * digits stop the two tiles from disagreeing about their own baseline.
 */
export function SummaryTile({
  href,
  icon: Icon,
  label,
  value,
  unit,
  delay,
}: {
  href: string
  icon: LucideIcon
  label: string
  value: string
  /** "بلاغ", "خزنة" — the noun the figure counts. */
  unit: string
  delay: number
}) {
  return (
    <Link
      href={href}
      style={{ "--rise-delay": `${delay}ms` } as CSSProperties}
      className="group rise lift bg-card border-border rounded-card hover:bg-sand-200 flex items-center gap-4 border p-5 shadow-[var(--shadow-raised)] transition-colors"
    >
      <span
        aria-hidden
        className="bg-background text-muted-foreground grid size-10 shrink-0 place-items-center rounded-full"
      >
        <Icon className="size-[18px]" strokeWidth={2.2} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="text-muted-foreground text-[13px] font-semibold">
          {label}
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-heading text-[22px] leading-none font-black tabular-nums">
            {value}
          </span>
          <span className="text-muted-foreground text-[13px]">{unit}</span>
        </div>
      </div>

      <ArrowRightIcon
        className="nudge text-muted-foreground size-4 shrink-0 rtl:-scale-x-100"
        strokeWidth={2.6}
        aria-hidden
      />
    </Link>
  )
}
