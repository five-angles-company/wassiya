"use client"

import { useCallback, useMemo } from "react"
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs"
import type { SortingState } from "@tanstack/react-table"

import { IDENTITY_STATUSES, type IdentityStatus } from "@/lib/identity"
import { useTableUrlState } from "@/lib/use-table-url-state"

const DEFAULT_SORTING: SortingState = [{ id: "joinedAt", desc: true }]

/** The one column the server can order by. */
const SORTABLE = ["joinedAt"] as const

/**
 * Every argument the identity queue sends, and its cursor bookkeeping.
 *
 * The filters live in the URL; the cursor stack does not. `use-table-url-state`
 * carries the whole reasoning, including why the reset is derived rather than
 * called by each setter.
 *
 * **No status is preselected.** This used to open on `pending` and `rejected`,
 * on the argument that the other two are an archive rather than a queue. The
 * cost was that the screen quietly disagreed with every count of it, and an
 * operator looking for a specific person had to work out why they were not
 * there. The facet is one click away; a hidden filter is not.
 */
export function useIdentityQueryState() {
  const [facets, setFacets] = useQueryStates(
    {
      status: parseAsArrayOf(
        parseAsStringLiteral(IDENTITY_STATUSES)
      ).withDefault([]),
      stuck: parseAsBoolean.withDefault(false),
    },
    { history: "replace", clearOnDefault: true }
  )

  const url = useTableUrlState({
    defaultSorting: DEFAULT_SORTING,
    sortableIds: SORTABLE,
    facetKey: `${facets.status.join(",")}|${facets.stuck}`,
  })

  const sort = url.sorting[0]?.desc === false ? "oldest" : "newest"

  const filters = useMemo(
    () => ({
      statuses: facets.status,
      stuckOnly: facets.stuck,
      email: url.search,
      sort: sort as "newest" | "oldest",
    }),
    [facets.status, facets.stuck, url.search, sort]
  )

  const toggleStatus = useCallback(
    (value: string, checked: boolean) => {
      // `useQueryStates` takes an updater over the whole map, not per key —
      // the partial-object form only accepts values.
      void setFacets((current) => ({
        status: checked
          ? current.status.includes(value as IdentityStatus)
            ? current.status
            : [...current.status, value as IdentityStatus]
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
    statusSelection: useMemo(
      () => new Set<string>(facets.status),
      [facets.status]
    ),
    toggleStatus,
    clearStatuses: useCallback(
      () => void setFacets({ status: [] }),
      [setFacets]
    ),
    stuckSelection: useMemo(
      () => new Set<string>(facets.stuck ? ["stuck"] : []),
      [facets.stuck]
    ),
    toggleStuck: useCallback(
      (_value: string, checked: boolean) => void setFacets({ stuck: checked }),
      [setFacets]
    ),
    clearStuck: useCallback(() => void setFacets({ stuck: false }), [setFacets]),
    pageNumber: url.pageNumber,
    canPrev: url.canPrev,
    prevPage: url.prevPage,
    nextPage: url.nextPage,
  }
}
