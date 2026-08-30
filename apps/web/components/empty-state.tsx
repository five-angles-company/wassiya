import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

/**
 * A list with nothing in it.
 *
 * Every empty state in this app is a *good* state and the copy has to say so.
 * "No reports yet" on a bereavement service reads as failure unless the body
 * explains that nothing is missing — so `body` is required, not optional, and
 * the icon sits on the muted tone rather than the accent: an empty list is not
 * something to draw the eye to.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="border-border rounded-card flex flex-col items-start gap-4 border border-dashed p-8">
      <span
        aria-hidden
        className="bg-muted text-muted-foreground grid size-11 place-items-center rounded-full"
      >
        <Icon className="size-5" strokeWidth={2.2} />
      </span>
      <div>
        <h2 className="font-heading text-[17px] font-extrabold">{title}</h2>
        <p className="text-muted-foreground mt-2 max-w-[54ch] text-[14.5px] leading-[1.7]">
          {body}
        </p>
      </div>
      {action}
    </div>
  )
}
