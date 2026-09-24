import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { IconDisc } from "@/components/icon-disc"

/**
 * The one thing the reader is asked to do on this page.
 *
 * - **At most one may be on screen**, and it holds the screen's only large
 *   button. Two asks make the reader choose which is real.
 * - It is absent, not empty, when nothing is owed.
 */
export function Ask({
  title,
  children,
  eyebrow,
  icon,
}: {
  title: string
  children: ReactNode
  eyebrow?: string
  icon?: LucideIcon
}) {
  return (
    <section className="rise-in bg-card border-border rounded-panel relative overflow-hidden border p-6 shadow-[var(--shadow-overlay)] md:p-9">
      <span aria-hidden className="bg-brand absolute inset-x-0 top-0 h-1" />
      <div className="flex items-start gap-4">
        {icon !== undefined && <IconDisc icon={icon} tone="attention" />}
        <div className="min-w-0">
          {eyebrow !== undefined && (
            <p className="text-surface-accent-ink text-[13px] font-bold">{eyebrow}</p>
          )}
          <h2 className="font-heading mt-1 text-[23px] leading-snug font-black md:text-[26px]">{title}</h2>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-5">{children}</div>
    </section>
  )
}
