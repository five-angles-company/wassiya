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

const HEIR_SIDES = ["linked", "unlinked"] as const

type ClaimSort = "newest" | "oldest" | "nameAsc" | "nameDesc"

/**
 * Every argument the claims workspace sends to the server, and the cursor
 * bookkeeping that goes with paging one.
 *
 * A hook rather than state scattered through the component, because these
 * pieces are not independent: **any change to a filter, the search or the sort
 * invalidates the cursor.** A cursor is a position in one particular ordered,
 * filtered stream — carry it across a filter change and the next page is a
 * position in a stream that no longer exists.
 *
 * The filters live in the URL so the dashboard can link straight at them —
 * `/claims?status=submitted` is the "awaiting review" tile's destination. The
 * cursor stack stays local, and rewinds whenever the URL changes; see
 * `use-table-url-state` for why both halves are that way round.
 *
 * **No status is preselected.** The workspace used to open on `submitted`,
 * which meant the screen's own answer to "how many claims are there" was four
 * when there are ten, and the six it hid were the ones nobody was looking for.
 * A console opens on its data; narrowing is the operator's move, and the
 * dashboard tile is there for whoever wants to arrive already narrowed.
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
      /** Absent is "either" — see `toggleHeir`. */
      heir: parseAsStringLiteral(HEIR_SIDES),
    },
    { history: "replace", clearOnDefault: true }
  )

  const url = useTableUrlState({
    defaultSorting: DEFAULT_SORTING,
    sortableIds: SORTABLE,
    facetKey: `${facets.status.join(",")}|${facets.identity.join(",")}|${facets.heir}`,
  })

  const sort = useMemo<ClaimSort>(() => {
    const first = url.sorting[0]
    if (first === undefined) return "newest"
    if (first.id === "claimantName") return first.desc ? "nameDesc" : "nameAsc"
    return first.desc ? "newest" : "oldest"
  }, [url.sorting])

  const heirLinked = facets.heir === null ? undefined : facets.heir === "linked"

  const filters = useMemo(
    () => ({
      statuses: facets.status,
      identity: facets.identity,
      heirLinked,
      search: url.search,
      sort,
    }),
    [facets.status, facets.identity, heirLinked, url.search, sort]
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
    /**
     * Heir linkage is one boolean, worn as a two-value facet.
     *
     * Ticking both is the same question as ticking neither — "either" — so both
     * collapse to absent rather than sending a contradiction to a filter that
     * can only express one side.
     */
    heirSelection: useMemo(
      () => new Set<string>(facets.heir === null ? [] : [facets.heir]),
      [facets.heir]
    ),
    toggleHeir: useCallback(
      (value: string, checked: boolean) => {
        void setFacets((current) => {
          const side = value as (typeof HEIR_SIDES)[number]
          if (!checked) return { heir: current.heir === side ? null : current.heir }
          return {
            heir: current.heir === null || current.heir === side ? side : null,
          }
        })
      },
      [setFacets]
    ),
    clearHeir: useCallback(() => void setFacets({ heir: null }), [setFacets]),
    pageNumber: url.pageNumber,
    canPrev: url.canPrev,
    prevPage: url.prevPage,
    nextPage: url.nextPage,
  }
}
