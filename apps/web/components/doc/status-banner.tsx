import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { IconDisc } from "@/components/icon-disc"

/**
 * Where something stands, in words: a headline and a short explanation on a
 * tinted panel.
 *
 * `date` is a label and a date already formatted by the caller — the end of a
 * waiting period, say. ⚠️ It never counts down: a number that changes while a
 * bereaved reader watches turns a calm page into a clock.
 */
export function StatusBanner({
  tone,
  icon,
  headline,
  children,
  date,
}: {
  tone: "settled" | "attention" | "quiet"
  icon: LucideIcon
  headline: string
  children?: ReactNode
  date?: { label: string; value: string }
}) {
  return (
    <div
      className={cn(
        "rise-in rounded-panel flex gap-4 p-6 md:gap-5 md:p-7",
        tone === "settled" && "bg-tone-settled-soft",
        tone === "attention" && "bg-tone-attention-soft",
        tone === "quiet" && "bg-foreground/[0.04]"
      )}
    >
      <IconDisc icon={icon} tone={tone} shape="circle" className="bg-card" />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-heading text-[19px] leading-snug font-extrabold md:text-[21px]",
            tone === "settled" && "text-tone-settled",
            tone === "attention" && "text-tone-attention"
          )}
        >
          {headline}
        </p>
        {children !== undefined && (
          <div className="text-foreground/80 mt-2 space-y-2 text-[15.5px] leading-[1.85]">{children}</div>
        )}
        {date !== undefined && (
          <p className="bg-card/80 mt-4 inline-flex flex-wrap items-baseline gap-x-2 rounded-full px-4 py-1.5 text-[14px]">
            <span className="text-muted-foreground">{date.label}</span>
            <span className="font-bold">{date.value}</span>
          </p>
        )}
      </div>
    </div>
  )
}
