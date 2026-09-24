import type { LucideIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

type Tone = "attention" | "settled" | "quiet" | "brand"
type Size = "sm" | "md" | "lg"

// Token pairs only — never ramp classes — so every tone flips with the theme.
const TONE: Record<Tone, string> = {
  attention: "bg-accent text-accent-foreground",
  settled: "bg-tone-settled-soft text-tone-settled",
  quiet: "bg-foreground/[0.06] text-muted-foreground",
  brand: "bg-brand text-white",
}

const SIZE: Record<Size, { box: string; icon: string }> = {
  sm: { box: "size-9", icon: "size-[18px]" },
  md: { box: "size-12", icon: "size-6" },
  lg: { box: "size-14", icon: "size-7" },
}

/** An icon on a tinted tile or circle. Decorative: the words beside it carry the meaning. */
export function IconDisc({
  icon: Icon,
  tone = "quiet",
  size = "md",
  shape = "tile",
  className,
}: {
  icon: LucideIcon
  tone?: Tone
  size?: Size
  shape?: "tile" | "circle"
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center",
        shape === "tile" ? "rounded-2xl" : "rounded-full",
        SIZE[size].box,
        TONE[tone],
        className
      )}
    >
      <Icon className={SIZE[size].icon} strokeWidth={2} />
    </span>
  )
}
