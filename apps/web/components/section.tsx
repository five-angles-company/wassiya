import type { ReactNode } from "react"

/**
 * A labelled region of a page. No border, no fill, no shadow.
 *
 * ## The rule this exists to enforce
 *
 * **A box means "this is an object"** — something to act on, or a state that
 * has happened. A list is not an object. Neither is a note, a caveat, or a
 * second fact. Ten of the app's thirty panels were quiet asides wearing a
 * border and a shadow, and once everything has a border the border has stopped
 * carrying information.
 *
 * What separates a section from its neighbour is the page's own rhythm and its
 * heading — which is enough, and is what "clean" actually consists of.
 *
 * ## The heading is the home screen's, because that is the one to match
 *
 * It was briefly 13px muted, which was my invention and disagreed with the
 * `<h2>` the home screen had been using all along. Eight section headings
 * existed across the app; this is now the only one, and it is home's — 17px
 * Cairo 800, with the count as a terracotta pill beside it.
 *
 * The count wears the accent because it is the one number on a page that is
 * asking for something. `Panel` uses the same 17px for its own title, so a
 * region and an object announce themselves at the same weight and the reader
 * learns one heading shape rather than two.
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
