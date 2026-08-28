import type { SortingState } from "@tanstack/react-table"

/**
 * Everything a server-driven table needs the caller to own.
 *
 * When this is present the table stops filtering, searching, sorting and
 * paging its own rows and becomes a renderer for the page it was handed. That
 * is not a mode flag for its own sake — the two cannot both be true at once. A
 * client-side filter over a server-side page hides rows the server already
 * chose to send, and a client-side pager pages a page.
 *
 * ## What cursor pagination cannot do, and why the shape looks like this
 *
 * Convex pagination is a cursor stream: a page knows only whether another page
 * follows it. There is no total and no page count, so there is no "of 12" and
 * no jump-to-last — hence `canNext` rather than a page count, and `total` as a
 * *bounded* tally the caller fetches separately.
 *
 * `sortLocked` exists for the same kind of reason: a Convex search returns
 * results ranked by relevance and the ordering cannot be replaced, so while a
 * search term is live the sort headers are inert. Saying so is the difference
 * between a considered behaviour and an apparently broken button.
 */
export type ServerTable = {
  search: string
  onSearchChange: (value: string) => void

  sorting: SortingState
  onSortingChange: (next: SortingState) => void
  /** True while a search term ranks the results and sorting cannot apply. */
  sortLocked: boolean

  /** 1-based, and only ever the page the operator has walked to. */
  page: number
  pageSize: number
  onPageSizeChange: (size: number) => void
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void

  /** Bounded row count for the current filters; `undefined` while loading. */
  total: { count: number; more: boolean } | undefined
  /** A page is in flight — the pager disables rather than flickering. */
  loading: boolean
}
