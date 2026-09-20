import type { ReactNode } from "react"

/**
 * A screen that is exactly one viewport tall and scrolls inside itself.
 *
 * The console has two kinds of page. A **table** screen must not move: its
 * toolbar and pager stay put while the rows scroll between them. Everything else
 * is a stack of panels that wants to be as tall as its content. The shell serves
 * the second by default, because it is the ordinary one; this wraps the first.
 *
 * **The layout cannot do this for everyone**, and it used to try. The content
 * region was a height-constrained flex column, and a flex child defaults to
 * `flex-shrink: 1` — so the dashboard's cards compressed to fit the viewport
 * instead of overflowing it, showing half their content, and the region never
 * scrolled because nothing ever exceeded it. The fix is not more `min-h-0`; the
 * constraint belongs to the pages that want it.
 *
 * `h-full` resolves because the region is a flex item with a definite height.
 * Inside, `flex-1 min-h-0` lets `DataTable`'s own `fill` mode take the space
 * left under the heading.
 */
export function FillScreen({ children }: { children: ReactNode }) {
  return <div className="flex h-full min-h-0 flex-col gap-6">{children}</div>
}
