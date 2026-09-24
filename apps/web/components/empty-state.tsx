import type { ReactNode } from "react"
import { InboxIcon, type LucideIcon } from "lucide-react"

import { NoticeCard } from "@/components/notice-card"

/**
 * Nothing here yet. Every empty state in this app is a *good* state, and the
 * copy has to say so — it is an answer, not an apology.
 */
export function EmptyState({
  title,
  body,
  action,
  hint,
  icon = InboxIcon,
}: {
  title: string
  body: string
  action?: ReactNode
  hint?: string
  icon?: LucideIcon
}) {
  return (
    <NoticeCard icon={icon} tone="settled" title={title} body={body} action={action}>
      {hint !== undefined && <p className="text-muted-foreground text-[13.5px]">{hint}</p>}
    </NoticeCard>
  )
}
