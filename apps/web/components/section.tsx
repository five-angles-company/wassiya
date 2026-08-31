import type { ReactNode } from "react"

/**
 * A labelled region of a page. No border, no fill, no shadow.
 *
 * ## The rule this exists to enforce
 *
 * **A box means "this is an object"** — something to act on, or a state that
 * has happened. A list of names is not an object. Neither is a note, a caveat,
 * or a second fact. Ten of the app's thirty panels were quiet asides wearing a
 * border and a shadow, and stacking three or four of those is what made a page
 * read as busy however carefully each one was set.
 *
 * So the quiet half of the system stops being a box. What separates a section
 * from its neighbour is the page's own rhythm and a small muted label — which
 * is enough, and is what "clean" actually consists of.
 *
 * ## The label is small on purpose
 *
 * 13px muted, against the page title's 26–30px and a panel heading's 17px. A
 * section label is a signpost, not a claim on attention: a reader scanning for
 * the thing that needs them should pass over it. Making these headings compete
 * with the title is the other half of why the pages felt crowded.
 *
 * `count` sits in the label rather than in a footer bar under the content —
 * a strip holding a figure and a button is chrome, and it was the fussiest
 * thing on the guardian's screen.
 */
export function Section({
  title,
  count,
  action,
  children,
}: {
  title: string
  /** Rendered after the label, dimmed — "٨" beside "الخزائن". */
  count?: string
  /** A control on the far side: "load more", "add". */
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 className="text-muted-foreground text-[13px] font-semibold">
          {title}
          {count !== undefined && (
            <span className="ms-2 tabular-nums opacity-60">{count}</span>
          )}
        </h2>
        {action !== undefined && <div className="ms-auto">{action}</div>}
      </div>
      {children}
    </section>
  )
}
