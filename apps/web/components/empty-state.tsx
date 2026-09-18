import type { ReactNode } from "react"

/**
 * A list with nothing in it.
 *
 * Every empty state in this app is a *good* state and the copy has to say so —
 * "No reports yet" on a bereavement service reads as failure unless the body
 * explains that nothing is missing. So `body` is required, not optional.
 *
 * It is set as a plain start-aligned block, like the rest of the document. The
 * centred card with a medallion it replaced dressed an answer up as an
 * apology — a framed, illustrated void in the middle of the screen says
 * something is supposed to be here, which is the opposite of what these states
 * mean.
 */
export function EmptyState({
  title,
  body,
  action,
  hint,
}: {
  title: string
  body: string
  action?: ReactNode
  /** A quiet line under the action — a duration, a caveat. */
  hint?: string
}) {
  return (
    <div className="border-border flex flex-col gap-3 border-y py-8">
      <h2 className="font-heading text-[19px] leading-tight font-extrabold">
        {title}
      </h2>
      <p className="text-muted-foreground max-w-[66ch] text-[15px] leading-[1.75]">
        {body}
      </p>

      {action !== undefined && <div className="pt-2">{action}</div>}
      {hint !== undefined && (
        <p className="text-muted-foreground text-[13px]">{hint}</p>
      )}
    </div>
  )
}
