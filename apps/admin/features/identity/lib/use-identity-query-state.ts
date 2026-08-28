"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { SortingState } from "@tanstack/react-table"

import type { IdentityStatus } from "@/lib/identity"

/**
 * What the queue opens on: the two states with work in front of them.
 *
 * `verified` is an archive and `unverified` is most of the table — someone who
 * signed up and has not started. Neither is a queue.
 */
const DEFAULT_STATUSES: IdentityStatus[] = ["pending", "rejected"]

/** Matches `use-claim-query-state`; see there for why a keystroke waits. */
const SEARCH_DEBOUNCE_MS = 300

const DEFAULT_SORTING: SortingState = [{ id: "joinedAt", desc: true }]

/**
 * Every argument the identity queue sends, and its cursor bookkeeping.
 *
 * The same shape as `use-claim-query-state` and for the same reason: a cursor
 * is a position in one particular ordered, filtered stream, so every filter,
 * search or sort change has to reset paging. Keeping the setters together is
 * what makes that impossible to forget.
 *
 * Not shared with the claims hook despite the resemblance — the filters differ
 * entirely, and the common part is four lines of cursor stack. Merging them
 * would produce a generic hook parameterised by everything.
 */
export function useIdentityQueryState() {
  const [statuses, setStatuses] = useState<IdentityStatus[]>(DEFAULT_STATUSES)
  const [stuckOnly, setStuckOnly] = useState(false)
  const [sorting, setSortingState] = useState<SortingState>(DEFAULT_SORTING)
  const [pageSize, setPageSizeState] = useState(25)

  const [emailInput, setEmailInput] = useState("")
  const [email, setEmail] = useState("")

  const [cursors, setCursors] = useState<(string | null)[]>([null])
  const resetPaging = useCallback(() => setCursors([null]), [])

  useEffect(() => {
    if (emailInput === email) return
    const timer = setTimeout(() => {
      // Trimmed here rather than server-side: an address pasted from an email
      // client arrives with whitespace, and an equality index does not forgive
      // it — the lookup would simply return nothing.
      setEmail(emailInput.trim())
      resetPaging()
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [emailInput, email, resetPaging])

  const sort = useMemo<"newest" | "oldest">(
    () => (sorting[0]?.desc === false ? "oldest" : "newest"),
    [sorting]
  )

  const filters = useMemo(
    () => ({ statuses, stuckOnly, email, sort }),
    [statuses, stuckOnly, email, sort]
  )

  const toggleStatus = useCallback(
    (value: string, checked: boolean) => {
      setStatuses((current) => {
        const next = new Set(current)
        if (checked) next.add(value as IdentityStatus)
        else next.delete(value as IdentityStatus)
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
    searchInput: emailInput,
    setSearch: setEmailInput,
    sorting,
    setSorting: useCallback(
      (next: SortingState) => {
        setSortingState(next.length === 0 ? DEFAULT_SORTING : next)
        resetPaging()
      },
      [resetPaging]
    ),
    statusSelection: useMemo(() => new Set<string>(statuses), [statuses]),
    toggleStatus,
    clearStatuses: useCallback(() => {
      setStatuses([])
      resetPaging()
    }, [resetPaging]),
    stuckSelection: useMemo(
      () => new Set<string>(stuckOnly ? ["stuck"] : []),
      [stuckOnly]
    ),
    toggleStuck: useCallback(
      (_value: string, checked: boolean) => {
        setStuckOnly(checked)
        resetPaging()
      },
      [resetPaging]
    ),
    clearStuck: useCallback(() => {
      setStuckOnly(false)
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
