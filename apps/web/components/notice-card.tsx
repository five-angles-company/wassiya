import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { IconDisc } from "@/components/icon-disc"

/**
 * A whole answer on one card: something is missing, something failed, there is
 * nothing here yet. `action` holds at most one button.
 */
export function NoticeCard({
  icon,
  tone = "quiet",
  title,
  body,
  action,
  children,
  headingLevel = "h2",
}: {
  icon: LucideIcon
  tone?: "attention" | "settled" | "quiet"
  title: string
  body: ReactNode
  action?: ReactNode
  children?: ReactNode
  headingLevel?: "h1" | "h2"
}) {
  const Heading = headingLevel

  return (
    <div className="rise-in bg-card border-border rounded-panel flex flex-col items-start gap-5 border p-7 shadow-[var(--shadow-raised)] md:p-9">
      <IconDisc icon={icon} tone={tone} />
      <div>
        <Heading className="font-heading text-[22px] leading-snug font-black md:text-[24px]">{title}</Heading>
        <div className="text-foreground/75 mt-2.5 max-w-[62ch] text-[15.5px] leading-[1.85]">{body}</div>
      </div>
      {children}
      {action !== undefined && <div className="pt-1">{action}</div>}
    </div>
  )
}
