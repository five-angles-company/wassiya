"use client"

import { useCallback, useMemo } from "react"
import {
  parseAsArrayOf,
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
 * Plan names as the subscription stores them — `model/plans.ts` is the
 * catalogue and these must match its keys exactly, because the server filters
 * on `subscription.plan` by equality. "paid" sat here until the catalogue
 * existed and matched nothing: the facet looked like a filter with no results
 * rather than a filter with no such plan.
 *
 * A closed list rather than `v.array(v.string())`'s freedom, because this is
 * the URL: a hand-edited `?plan=enterprise` should fall out here rather than
 * reach the server.
 */
const PLANS = ["free", "annual"] as const

/**
 * Every argument the owners list sends, and its cursor bookkeeping.
 *
 * Shared rather than feature-local: `/owners` and `/subscriptions` are the
 * same query behind different columns, so they send the same arguments and one
 * of them importing the other would be exactly the cross-feature reach this
 * app forbids.
 *
 * The filters live in the URL and the cursor stack does not — `use-table-url-
 * state` carries that reasoning, along with why the paging reset is derived
 * from the params rather than called by each setter.
 */
export function useOwnerQueryState() {
  const [facets, setFacets] = useQueryStates(
    {
      identity: parseAsArrayOf(
        parseAsStringLiteral(IDENTITY_STATUSES)
      ).withDefault([]),
      plan: parseAsArrayOf(parseAsStringLiteral(PLANS)).withDefault([]),
    },
    { history: "replace", clearOnDefault: true }
  )

  const url = useTableUrlState({
    defaultSorting: DEFAULT_SORTING,
    sortableIds: SORTABLE,
    facetKey: `${facets.identity.join(",")}|${facets.plan.join(",")}`,
  })

  const sort: "newest" | "oldest" =
    url.sorting[0]?.desc === false ? "oldest" : "newest"

  const filters = useMemo(
    () => ({
      identity: facets.identity,
      plans: facets.plan as string[],
      search: url.search,
      sort,
    }),
    [facets.identity, facets.plan, url.search, sort]
  )

  const toggleIn = useCallback(
    (key: "identity" | "plan") => (value: string, checked: boolean) => {
      void setFacets((current) => ({
        [key]: checked
          ? current[key].includes(value as never)
            ? current[key]
            : [...current[key], value]
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
    identitySelection: useMemo(
      () => new Set<string>(facets.identity),
      [facets.identity]
    ),
    toggleIdentity: toggleIn("identity") as (
      value: string,
      checked: boolean
    ) => void,
    clearIdentity: useCallback(
      () => void setFacets({ identity: [] as IdentityStatus[] }),
      [setFacets]
    ),
    planSelection: useMemo(() => new Set<string>(facets.plan), [facets.plan]),
    togglePlan: toggleIn("plan"),
    clearPlans: useCallback(() => void setFacets({ plan: [] }), [setFacets]),
    pageNumber: url.pageNumber,
    canPrev: url.canPrev,
    prevPage: url.prevPage,
    nextPage: url.nextPage,
  }
}
