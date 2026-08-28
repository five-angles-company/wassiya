"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { SortingState } from "@tanstack/react-table"

import type { ClaimStatus } from "@/features/claims/lib/status"
import type { IdentityStatus } from "@/features/claims/lib/identity"

/** What the workspace opens on — the only status with a decision in front of it. */
const DEFAULT_STATUSES: ClaimStatus[] = ["submitted"]

/**
 * How long a keystroke waits before it becomes a query.
 *
 * Server-side search means every character would otherwise be a round trip and
 * a fresh subscription. 300ms is long enough to swallow typing and short enough
 * that the table does not feel detached from the box.
 */
const SEARCH_DEBOUNCE_MS = 300

type ClaimSort = "newest" | "oldest" | "nameAsc" | "nameDesc"

/** The default order, and what the sort headers fall back to. */
const DEFAULT_SORTING: SortingState = [{ id: "submittedAt", desc: true }]

/**
 * Every argument the claims workspace sends to the server, and the cursor
 * bookkeeping that goes with paging one.
 *
 * A hook rather than state scattered through the component, because these
 * pieces are not independent: **any change to a filter, the search or the sort
 * invalidates the cursor.** A cursor is a position in one particular ordered,
 * filtered stream — carry it across a filter change and the next page is a
 * position in a stream that no longer exists. Every setter here therefore
 * resets paging, and putting them together is what makes that impossible to
 * forget.
 */
export function useClaimQueryState() {
  const [statuses, setStatuses] = useState<ClaimStatus[]>(DEFAULT_STATUSES)
  const [identity, setIdentity] = useState<IdentityStatus[]>([])
  const [heirLinked, setHeirLinked] = useState<boolean | undefined>(undefined)
  const [sorting, setSortingState] = useState<SortingState>(DEFAULT_SORTING)
  const [pageSize, setPageSizeState] = useState(25)

  // Two search values: what is being typed, and what has been asked for.
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")

  // A stack of the cursors already visited. `null` is the first page, which is
  // why the stack starts holding it rather than empty — `prev` is then just a
  // pop, with no special case for going back to the start.
  const [cursors, setCursors] = useState<(string | null)[]>([null])

  const resetPaging = useCallback(() => setCursors([null]), [])

  useEffect(() => {
    if (searchInput === search) return
    const timer = setTimeout(() => {
      setSearch(searchInput)
      resetPaging()
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, search, resetPaging])

  const sort = useMemo<ClaimSort>(() => {
    const first = sorting[0]
    if (first === undefined) return "newest"
    if (first.id === "claimantName") return first.desc ? "nameDesc" : "nameAsc"
    return first.desc ? "newest" : "oldest"
  }, [sorting])

  const filters = useMemo(
    () => ({ statuses, identity, heirLinked, search, sort }),
    [statuses, identity, heirLinked, search, sort]
  )

  const setSorting = useCallback(
    (next: SortingState) => {
      // An empty sort would leave the server without an order to apply, so a
      // third click returns to the default rather than to nothing.
      setSortingState(next.length === 0 ? DEFAULT_SORTING : next)
      resetPaging()
    },
    [resetPaging]
  )

  const toggleStatus = useCallback(
    (value: string, checked: boolean) => {
      setStatuses((current) => {
        const next = new Set(current)
        if (checked) next.add(value as ClaimStatus)
        else next.delete(value as ClaimStatus)
        return [...next]
      })
      resetPaging()
    },
    [resetPaging]
  )

  const toggleIdentity = useCallback(
    (value: string, checked: boolean) => {
      setIdentity((current) => {
        const next = new Set(current)
        if (checked) next.add(value as IdentityStatus)
        else next.delete(value as IdentityStatus)
        return [...next]
      })
      resetPaging()
    },
    [resetPaging]
  )

  /**
   * Heir linkage is one boolean, worn as a two-value facet.
   *
   * Ticking both is the same question as ticking neither — "either" — so both
   * collapse to `undefined` rather than sending a contradiction to a filter
   * that can only express one side.
   */
  const heirSelection = useMemo(
    () =>
      new Set<string>(
        heirLinked === undefined ? [] : [heirLinked ? "linked" : "unlinked"]
      ),
    [heirLinked]
  )

  const toggleHeir = useCallback(
    (value: string, checked: boolean) => {
      setHeirLinked((current) => {
        const side = value === "linked"
        if (!checked) return current === side ? undefined : current
        return current === undefined || current === side ? side : undefined
      })
      resetPaging()
    },
    [resetPaging]
  )

  const setPageSize = useCallback(
    (size: number) => {
      setPageSizeState(size)
      resetPaging()
    },
    [resetPaging]
  )

  const nextPage = useCallback((continueCursor: string | null) => {
    if (continueCursor === null) return
    setCursors((current) => [...current, continueCursor])
  }, [])

  const prevPage = useCallback(() => {
    setCursors((current) => (current.length > 1 ? current.slice(0, -1) : current))
  }, [])

  // The page currently being shown. `null` on the first, which is also the
  // bottom of the stack.
  const cursor = cursors[cursors.length - 1] ?? null

  return {
    filters,
    cursor,
    pageSize,
    setPageSize,
    searchInput,
    setSearch: setSearchInput,
    sorting,
    setSorting,
    toggleStatus,
    clearStatuses: useCallback(() => {
      setStatuses([])
      resetPaging()
    }, [resetPaging]),
    toggleIdentity,
    clearIdentity: useCallback(() => {
      setIdentity([])
      resetPaging()
    }, [resetPaging]),
    heirSelection,
    toggleHeir,
    clearHeir: useCallback(() => {
      setHeirLinked(undefined)
      resetPaging()
    }, [resetPaging]),
    pageNumber: cursors.length,
    canPrev: cursors.length > 1,
    prevPage,
    nextPage,
  }
}
