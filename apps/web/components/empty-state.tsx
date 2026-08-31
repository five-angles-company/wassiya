import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

/**
 * A list with nothing in it.
 *
 * Every empty state in this app is a *good* state and the copy has to say so.
 * "No reports yet" on a bereavement service reads as failure unless the body
 * explains that nothing is missing — so `body` is required, not optional.
 *
 * ## What it looked like before, and why each part was wrong
 *
 * A full-width dashed box with its content pinned to the start edge. The dashes
 * read as a drop target rather than as a state; the full width left a metre of
 * void beside three lines of text; and start-aligned content inside a
 * stretched container is what made the void look like a mistake rather than
 * margin.
 *
 * Now: a card, sized to its content and centred, with the type centred inside
 * it. Solid hairline, the card tone, `--shadow-raised` and the sheet radius —
 * the same depth every other surface in the app has and this one never took.
 *
 * ## `fill`
 *
 * `60svh` and centred, for a screen whose empty state *is* the screen. Without
 * it the composition sits in the top third and the rest of the viewport is
 * bare, which is the single most common way an otherwise fine empty state
 * reads as broken. `svh` rather than `vh` because mobile chrome shrinks the
 * visual viewport, and the difference is a button below the fold.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  hint,
  fill = false,
}: {
  icon: LucideIcon
  title: string
  body: string
  action?: ReactNode
  /** A quiet line under the action — a duration, a caveat. */
  hint?: string
  fill?: boolean
}) {
  const card = (
    <div className="bg-card border-border rounded-sheet mx-auto flex w-full max-w-[520px] flex-col items-center border px-8 py-12 text-center shadow-[var(--shadow-raised)]">
      <span
        aria-hidden
        className="bg-background text-muted-foreground mb-6 grid size-14 place-items-center rounded-full"
      >
        <Icon className="size-6" strokeWidth={2} />
      </span>

      <h2 className="font-heading text-[19px] font-extrabold">{title}</h2>
      <p className="text-muted-foreground mx-auto mt-3 max-w-[42ch] text-[14.5px] leading-[1.75]">
        {body}
      </p>

      {action !== undefined && <div className="mt-7">{action}</div>}
      {hint !== undefined && (
        <p className="text-muted-foreground mt-3 text-[13px]">{hint}</p>
      )}
    </div>
  )

  if (!fill) return card

  return (
    <div className="flex min-h-[60svh] items-center justify-center">{card}</div>
  )
}
