"use client"

import { useCallback, useMemo } from "react"
import {
  parseAsArrayOf,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs"
import type { SortingState } from "@tanstack/react-table"

import { CLAIM_STATUSES, type ClaimStatus } from "@/features/claims/lib/status"
import { IDENTITY_STATUSES, type IdentityStatus } from "@/lib/identity"
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
      identity: parseAsArrayOf(
        parseAsStringLiteral(IDENTITY_STATUSES)
      ).withDefault([]),
    },
    { history: "replace", clearOnDefault: true }
  )

  const url = useTableUrlState({
    defaultSorting: DEFAULT_SORTING,
    sortableIds: SORTABLE,
    facetKey: `${facets.status.join(",")}|${facets.identity.join(",")}`,
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
      identity: facets.identity,
      search: url.search,
      sort,
    }),
    [facets.status, facets.identity, url.search, sort]
  )

  const toggleIn = useCallback(
    <T extends string>(key: "status" | "identity") =>
      (value: string, checked: boolean) => {
        void setFacets((current) => ({
          [key]: checked
            ? current[key].includes(value as never)
              ? current[key]
              : [...current[key], value as T]
            : current[key].filter((entry: string) => entry !== value),
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
    toggleStatus: toggleIn<ClaimStatus>("status"),
    clearStatuses: useCallback(
      () => void setFacets({ status: [] }),
      [setFacets]
    ),
    toggleIdentity: toggleIn<IdentityStatus>("identity"),
    clearIdentity: useCallback(
      () => void setFacets({ identity: [] }),
      [setFacets]
    ),
    pageNumber: url.pageNumber,
    canPrev: url.canPrev,
    prevPage: url.prevPage,
    nextPage: url.nextPage,
  }
}
