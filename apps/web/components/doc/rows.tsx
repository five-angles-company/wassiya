import Link from "next/link"
import { ChevronLeftIcon, type LucideIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { Paper } from "@/components/doc/paper"
import { IconDisc } from "@/components/icon-disc"

/** A list of things of one kind, as rows on one card — one frame around the set, not one per row. */
export function Rows({ children }: { children: React.ReactNode }) {
  return (
    <Paper className="rise-in">
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
  icon,
}: {
  href: string
  title: string
  status: string
  tone: "settled" | "attention" | "quiet"
  /** Provenance — a date, a reference. Never the status. */
  meta?: string
  icon?: LucideIcon
}) {
  return (
    <Link href={href} className="group hover:bg-foreground/[0.03] flex items-center gap-4 px-5 py-4 transition-colors md:px-6">
      {icon !== undefined && <IconDisc icon={icon} tone={tone} size="sm" />}
      <div className="min-w-0 flex-1">
        <p className="font-heading text-[17px] leading-tight font-bold">{title}</p>
        <p
          className={cn(
            "mt-1.5 text-[14px] font-semibold",
            tone === "attention" && "text-tone-attention",
            tone === "settled" && "text-tone-settled",
            tone === "quiet" && "text-muted-foreground"
          )}
        >
          {status}
        </p>
        {meta !== undefined && <p className="text-muted-foreground mt-1 text-[12.5px]">{meta}</p>}
      </div>
      <ChevronLeftIcon aria-hidden className="nudge text-muted-foreground size-5 shrink-0 ltr:rotate-180" strokeWidth={2.4} />
    </Link>
  )
}
