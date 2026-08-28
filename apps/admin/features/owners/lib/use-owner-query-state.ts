"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { SortingState } from "@tanstack/react-table"

import type { IdentityStatus } from "@/lib/identity"

/** Matches the other browsers; see `use-claim-query-state` for the debounce. */
const SEARCH_DEBOUNCE_MS = 300

const DEFAULT_SORTING: SortingState = [{ id: "joinedAt", desc: true }]

/**
 * Every argument the owners list sends, and its cursor bookkeeping.
 *
 * Third of its kind, and deliberately still not abstracted: the shared part is
 * a cursor stack and a debounce, and the filters differ entirely between the
 * three. A generic hook parameterised by every filter shape would be longer
 * than the three it replaced, and would make each of them harder to read.
 */
export function useOwnerQueryState() {
  const [identity, setIdentity] = useState<IdentityStatus[]>([])
  const [plans, setPlans] = useState<string[]>([])
  const [sorting, setSortingState] = useState<SortingState>(DEFAULT_SORTING)
  const [pageSize, setPageSizeState] = useState(25)

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")

  const [cursors, setCursors] = useState<(string | null)[]>([null])
  const resetPaging = useCallback(() => setCursors([null]), [])

  useEffect(() => {
    if (searchInput === search) return
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      resetPaging()
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, search, resetPaging])

  const sort = useMemo<"newest" | "oldest">(
    () => (sorting[0]?.desc === false ? "oldest" : "newest"),
    [sorting]
  )

  const filters = useMemo(
    () => ({ identity, plans, search, sort }),
    [identity, plans, search, sort]
  )

  const toggleIn = useCallback(
    <T extends string>(
      set: React.Dispatch<React.SetStateAction<T[]>>
    ) =>
      (value: string, checked: boolean) => {
        set((current) => {
          const next = new Set<T>(current)
          if (checked) next.add(value as T)
          else next.delete(value as T)
          return [...next]
        })
        resetPaging()
      },
    [resetPaging]
  )

  return {
    filters,
    cursor: cursors[cursors.length - 1] ?? null,
    pageSize,
    setPageSize: useCallback(
      (size: number) => {
        setPageSizeState(size)
        resetPaging()
      },
      [resetPaging]
    ),
    searchInput,
    setSearch: setSearchInput,
    sorting,
    setSorting: useCallback(
      (next: SortingState) => {
        setSortingState(next.length === 0 ? DEFAULT_SORTING : next)
        resetPaging()
      },
      [resetPaging]
    ),
    identitySelection: useMemo(() => new Set<string>(identity), [identity]),
    toggleIdentity: toggleIn(setIdentity),
    clearIdentity: useCallback(() => {
      setIdentity([])
      resetPaging()
    }, [resetPaging]),
    planSelection: useMemo(() => new Set<string>(plans), [plans]),
    togglePlan: toggleIn(setPlans),
    clearPlans: useCallback(() => {
      setPlans([])
      resetPaging()
    }, [resetPaging]),
    pageNumber: cursors.length,
    canPrev: cursors.length > 1,
    prevPage: useCallback(
      () =>
        setCursors((current) =>
          current.length > 1 ? current.slice(0, -1) : current
        ),
      []
    ),
    nextPage: useCallback((continueCursor: string | null) => {
      if (continueCursor === null) return
      setCursors((current) => [...current, continueCursor])
    }, []),
  }
}
