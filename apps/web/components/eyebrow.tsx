import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

/** The small pill above a title, as on the landing site: what this page is about. */
export function Eyebrow({
  children,
  icon: Icon,
  className,
}: {
  children: ReactNode
  icon?: LucideIcon
  className?: string
}) {
  return (
    <p
      className={cn(
        "border-border bg-card/70 text-surface-accent-ink inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold backdrop-blur",
        className
      )}
    >
      {Icon ? (
        <Icon className="size-3.5" strokeWidth={2.5} aria-hidden />
      ) : (
        <span aria-hidden className="bg-primary size-1.5 rounded-full" />
      )}
      {children}
    </p>
  )
}
