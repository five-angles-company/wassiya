"use client"

import { useCallback, useMemo } from "react"
import {
  parseAsArrayOf,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs"
import type { SortingState } from "@tanstack/react-table"

import { CLAIM_STATUSES, type ClaimStatus } from "@/features/claims/lib/status"
import { useTableUrlState } from "@/lib/use-table-url-state"

/** The default order, and what the sort headers fall back to. */
const DEFAULT_SORTING: SortingState = [{ id: "submittedAt", desc: true }]

/** The two columns the server can order by. */
const SORTABLE = ["submittedAt", "claimantName"] as const

type ClaimSort = "newest" | "oldest" | "nameAsc" | "nameDesc"

/**
 * Every argument the claims workspace sends to the server, and the cursor
 * bookkeeping that goes with paging one.
 *
 * A hook rather than scattered state, because these pieces are not independent:
 * **any change to a filter, the search or the sort invalidates the cursor.** A
 * cursor is a position in one particular ordered, filtered stream.
 *
 * The filters live in the URL so the dashboard can link straight at them; the
 * cursor stack stays local and rewinds whenever the URL changes. See
 * `use-table-url-state` for why both halves are that way round.
 *
 * **No status is preselected.** The workspace used to open on `submitted`, which
 * meant the screen's own answer to "how many claims are there" was four when
 * there are ten. A console opens on its data; narrowing is the operator's move.
 */
export function useClaimQueryState() {
  const [facets, setFacets] = useQueryStates(
    {
      status: parseAsArrayOf(parseAsStringLiteral(CLAIM_STATUSES)).withDefault(
        []
      ),
    },
    { history: "replace", clearOnDefault: true }
  )

  const url = useTableUrlState({
    defaultSorting: DEFAULT_SORTING,
    sortableIds: SORTABLE,
    facetKey: facets.status.join(","),
  })

  const sort = useMemo<ClaimSort>(() => {
    const first = url.sorting[0]
    if (first === undefined) return "newest"
    if (first.id === "claimantName") return first.desc ? "nameDesc" : "nameAsc"
    return first.desc ? "newest" : "oldest"
  }, [url.sorting])

  const filters = useMemo(
    () => ({
      statuses: facets.status,
      search: url.search,
      sort,
    }),
    [facets.status, url.search, sort]
  )

  const toggleStatus = useCallback(
    (value: string, checked: boolean) => {
      void setFacets((current) => ({
        status: checked
          ? current.status.includes(value as ClaimStatus)
            ? current.status
            : [...current.status, value as ClaimStatus]
          : current.status.filter((entry) => entry !== value),
      }))
    },
    [setFacets]
  )

  return {
    filters,
    cursor: url.cursor,
    pageSize: url.pageSize,
    setPageSize: url.setPageSize,
    searchInput: url.searchInput,
    setSearch: url.setSearch,
    sorting: url.sorting,
    setSorting: url.setSorting,
    toggleStatus,
    clearStatuses: useCallback(
      () => void setFacets({ status: [] }),
      [setFacets]
    ),
    pageNumber: url.pageNumber,
    canPrev: url.canPrev,
    prevPage: url.prevPage,
    nextPage: url.nextPage,
  }
}
