import type { SortingState } from "@tanstack/react-table"

/**
 * Everything a server-driven table needs the caller to own. When this is present
 * the table stops filtering, searching, sorting and paging its own rows and
 * becomes a renderer for the page it was handed — the two cannot both be true at
 * once, because a client-side filter over a server-side page hides rows the
 * server already chose to send, and a client-side pager pages a page.
 *
 * Convex pagination is a cursor stream: a page knows only whether another
 * follows it. There is no total and no page count, hence `canNext` rather than a
 * page count, and `total` as a *bounded* tally the caller fetches separately.
 *
 * `sortLocked` exists for the same kind of reason: a Convex search returns
 * results ranked by relevance and that ordering cannot be replaced, so while a
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
