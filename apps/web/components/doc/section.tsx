import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { IconDisc } from "@/components/icon-disc"

/**
 * A division of the page, as its own card.
 *
 * ⚠️ Never inside an `Ask` or another card — a card in a card reads as a
 * mistake. Inside one, use a plain heading.
 */
export function DocSection({
  title,
  children,
  icon,
  description,
}: {
  title: string
  children?: ReactNode
  icon?: LucideIcon
  description?: string
}) {
  return (
    <section className="rise-in bg-card border-border rounded-card border p-6 shadow-[var(--shadow-raised)] md:p-8">
      <div className="flex items-start gap-4">
        {icon !== undefined && <IconDisc icon={icon} size="sm" />}
        <div className="min-w-0">
          <h2 className="font-heading text-[20px] leading-snug font-extrabold">{title}</h2>
          {description !== undefined && (
            <p className="text-foreground/75 mt-1 text-[15px] leading-[1.8]">{description}</p>
          )}
        </div>
      </div>
      {children !== undefined && <div className="mt-5 flex flex-col gap-4">{children}</div>}
    </section>
  )
}
