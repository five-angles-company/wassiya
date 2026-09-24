import type { ElementType, ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

/** The card: a surface lifted off the page. `padded` for content, bare for row lists. */
export function Paper({
  children,
  className,
  padded = false,
  as: Tag = "div",
}: {
  children: ReactNode
  className?: string
  padded?: boolean
  as?: ElementType
}) {
  return (
    <Tag
      className={cn(
        "bg-card border-border rounded-card overflow-hidden border shadow-[var(--shadow-raised)]",
        padded && "p-6 md:p-8",
        className
      )}
    >
      {children}
    </Tag>
  )
}
