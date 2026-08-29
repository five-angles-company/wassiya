"use client"

import { useEffect, useMemo, useState } from "react"
import type { SortingState } from "@tanstack/react-table"
import { createParser, parseAsInteger, parseAsString, useQueryStates } from "nuqs"

/**
 * How long a keystroke waits before it becomes a query.
 *
 * Server-side search means every character would otherwise be a round trip and
 * a fresh subscription. 300ms is long enough to swallow typing and short enough
 * that the table does not feel detached from the box.
 *
 * This is downstream of the URL, not in place of it: the address bar tracks
 * what is being typed (throttled), and only the settled value reaches Convex.
 */
const SEARCH_DEBOUNCE_MS = 300

/** Matches the page-size menu in `DataTable`. */
const DEFAULT_PAGE_SIZE = 25

/**
 * A sort as one URL token — `submittedAt.desc`.
 *
 * Readable in a pasted link, and validated against the columns the screen
 * actually sorts by: a hand-edited `?sort=nonsense` parses to `null` and falls
 * back to the default rather than reaching a Convex validator that would throw
 * and blank the table.
 *
 * One column only. Every server query here takes a single `sort` argument, so
 * a multi-column state in the URL would encode an order the server cannot
 * honour.
 */
function sortingParser(ids: readonly string[]) {
  return createParser<SortingState>({
    parse: (query) => {
      const [id, direction] = query.split(".")
      if (id === undefined || !ids.includes(id)) return null
      if (direction !== "asc" && direction !== "desc") return null
      return [{ id, desc: direction === "desc" }]
    },
    serialize: (value) => {
      const first = value[0]
      if (first === undefined) return ""
      return `${first.id}.${first.desc ? "desc" : "asc"}`
    },
    eq: (a, b) => a[0]?.id === b[0]?.id && a[0]?.desc === b[0]?.desc,
  })
}

/**
 * Search, sort, page size and the cursor stack — the part every server-driven
 * table in this console holds identically.
 *
 * ## Why the cursor stack is *not* in the URL
 *
 * A Convex cursor is an opaque position inside one particular ordered, filtered
 * stream. Pasted into a link it is either stale or a position in someone else's
 * result set, and the row it lands on would be neither the first nor the one
 * that was shared. So the URL carries the *question* — filters, search, sort,
 * page size — and the answer starts at page one. That is also what a shared
 * link means to the person receiving it.
 *
 * ## Why the reset is derived rather than called
 *
 * Every setter used to call `resetPaging()` by hand. Once the params live in
 * the URL that is no longer enough: back/forward and a dashboard link landing
 * on a screen that is already mounted both change the filters without passing
 * through a setter, leaving a cursor from the previous stream in place. The
 * stack therefore carries the key it belongs to and resets during render when
 * they disagree — the same shape as `use-last-loaded.ts`.
 *
 * `facetKey` is how a screen's own filters join that key. It is the one thing
 * this hook cannot know, because the filters are the part that genuinely
 * differs between the ten screens.
 */
export function useTableUrlState({
  defaultSorting,
  sortableIds,
  facetKey,
}: {
  /** Restored when a third header click would otherwise clear the sort. */
  defaultSorting: SortingState
  /** Column ids this screen's server query can order by. */
  sortableIds: readonly string[]
  /** A stable serialisation of the screen's own filters. */
  facetKey: string
}) {
  const parsers = useMemo(
    () => ({
      q: parseAsString.withDefault(""),
      sort: sortingParser(sortableIds).withDefault(defaultSorting),
      size: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
    }),
    // Both are literal constants at every call site; listing them would only
    // invite a caller to pass an inline array and rebuild the parsers forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [params, setParams] = useQueryStates(parsers, {
    // Never `push`. A facet click is not a place an operator wants to return
    // to; back should leave the screen — usually to the dashboard tile that
    // sent them here.
    history: "replace",
    clearOnDefault: true,
    // The address bar keeps up with typing without a write per keystroke. The
    // value the table reads is debounced separately below.
    throttleMs: 300,
  })

  // Trimmed here rather than server-side: a term pasted from an email client
  // arrives with whitespace, and an equality index does not forgive it — the
  // lookup would simply return nothing.
  const trimmed = params.q.trim()
  const [search, setSearch] = useState(trimmed)

  useEffect(() => {
    if (trimmed === search) return
    const timer = setTimeout(() => setSearch(trimmed), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [trimmed, search])

  const sortToken = params.sort[0]
    ? `${params.sort[0].id}.${params.sort[0].desc}`
    : ""
  const key = `${facetKey}|${search}|${sortToken}|${params.size}`

  const [stack, setStack] = useState<{
    key: string
    cursors: (string | null)[]
  }>({ key, cursors: [null] })

  if (stack.key !== key) setStack({ key, cursors: [null] })
  const cursors = stack.key === key ? stack.cursors : [null]

  return {
    /** Raw, for the search box — updates optimistically as it is typed. */
    searchInput: params.q,
    /** Settled and trimmed, for the server. */
    search,
    setSearch: (value: string) => void setParams({ q: value }),

    sorting: params.sort,
    setSorting: (next: SortingState) =>
      // An empty sort would leave the server without an order to apply, so a
      // third click returns to the default rather than to nothing.
      void setParams({ sort: next.length === 0 ? defaultSorting : next }),

    pageSize: params.size,
    setPageSize: (size: number) => void setParams({ size }),

    cursor: cursors[cursors.length - 1] ?? null,
    pageNumber: cursors.length,
    canPrev: cursors.length > 1,
    prevPage: () =>
      setStack((current) =>
        current.cursors.length > 1
          ? { ...current, cursors: current.cursors.slice(0, -1) }
          : current
      ),
    nextPage: (continueCursor: string | null) => {
      if (continueCursor === null) return
      setStack((current) => ({
        ...current,
        cursors: [...current.cursors, continueCursor],
      }))
    },
  }
}
