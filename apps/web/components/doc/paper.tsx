import type { ReactNode } from "react"

/**
 * A document attached to the letter.
 *
 * **The page is the letter; this is an attachment.** A card goes around things
 * that are *data* — a record of dates, a list of vaults, the contents of a box
 * — and never around the page's own argument. `DocTitle`, `StatusLine`, `Prose`
 * and `Ask` stay on the bare ground: boxing the primary content while the prose
 * around it stays bare sends the eye to the attachment instead of the letter.
 *
 * One exception, and it proves the rule: the guardian invitation sets two
 * bounded lists side by side to be read *against* each other. A comparison of
 * two closed sets is nearer to data than to prose, and the card edge is what
 * tells the eye where one set ends — which is otherwise four hairlines' work.
 *
 * A hairline and no shadow. The fill is `--card`, which sits *above* the ground
 * rather than below it, so this reads as paper laid on a desk.
 *
 * ⚠️ **Nothing with an input in it goes on paper.** Fields are `sand-50`, the
 * same colour as this surface, so a field here would be a border and nothing
 * else. That falls out of the rule — forms are the letter asking you something,
 * not an attachment — so it costs nothing to honour.
 */
export function Paper({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-card border-border overflow-hidden rounded-xl border ${className ?? ""}`}
    >
      {children}
    </div>
  )
}
