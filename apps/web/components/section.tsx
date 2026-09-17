import type { ReactNode } from "react"

/**
 * A labelled region of a page. No border, no fill, no shadow.
 *
 * **A box means "this is an object"** — something to act on, or a state that has
 * happened. A list is not an object; neither is a note, a caveat, or a second
 * fact. Ten of the app's thirty panels were quiet asides wearing a border and a
 * shadow, and once everything has a border the border carries no information.
 * What separates a section from its neighbour is the page's rhythm and its
 * heading.
 *
 * The heading is the home screen's — 17px Cairo 800, with the count as a
 * terracotta pill beside it. Eight section headings existed across the app; this
 * is the only one. The count wears the accent because it is the one number on a
 * page that is asking for something, and `Panel` uses the same 17px for its own
 * title, so a region and an object announce themselves at the same weight.
 */
export function Section({
  title,
  count,
  action,
  children,
}: {
  title: string
  /** A figure that matters — the number of things waiting. */
  count?: string
  /** A control on the far side: paging, "add". */
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <h2 className="font-heading text-[17px] font-extrabold">{title}</h2>
        {count !== undefined && (
          <span className="bg-primary text-primary-foreground grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-bold tabular-nums">
            {count}
          </span>
        )}
        {action !== undefined && <div className="ms-auto">{action}</div>}
      </div>
      {children}
    </section>
  )
}
