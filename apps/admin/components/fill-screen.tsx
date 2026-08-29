import type { ReactNode } from "react"

/**
 * A screen that is exactly one viewport tall and scrolls inside itself.
 *
 * The console has two kinds of page and they want opposite things from the
 * shell. A **table** screen must not move: its toolbar and pager stay put while
 * the rows scroll between them, so a hundred rows do not push the pager below
 * the fold. Everything else — the dashboard, the two detail screens, the
 * releases and jobs boards — is a stack of panels that simply wants to be as
 * tall as its content and scroll the ordinary way.
 *
 * The shell serves the second kind by default, because it is the ordinary one.
 * This wraps the first.
 *
 * ## Why the layout cannot just do this for everyone
 *
 * It used to. The content region was a height-constrained flex column, and a
 * flex child defaults to `flex-shrink: 1` — so the dashboard's cards and charts
 * compressed to fit the viewport instead of overflowing it, showing half their
 * content, and the region never scrolled because nothing ever exceeded it. The
 * fix is not more `min-h-0`; it is that the constraint belongs to the pages
 * that want it.
 *
 * `h-full` resolves because the region is a flex item with a definite height.
 * Inside, `flex-1 min-h-0` on the table is what lets `DataTable`'s own `fill`
 * mode take the space left under the heading.
 */
export function FillScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-6">{children}</div>
  )
}
