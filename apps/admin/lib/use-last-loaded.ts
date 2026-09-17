"use client"

import { useState } from "react"

/**
 * Hold on to the last loaded value while the next one is in flight.
 *
 * Convex's `useQuery` returns `undefined` whenever its **arguments** change, not
 * just on first mount — a new argument is a new subscription — so every filter
 * toggle, debounced keystroke and page step briefly returns `undefined`.
 * Rendered naively that is an unmount, not a flicker: the browsers each had
 * `if (page === undefined) return <Skeleton />`, so changing a filter tore the
 * table down and took the operator's row selection, column visibility and sort
 * with it. Keeping the previous page on screen makes it a refresh of a table
 * that stays mounted.
 *
 * `setState` during render is React's documented "adjusting state when a prop
 * changes" pattern and deliberately not an effect, which would commit the stale
 * value first and then correct it. The call is guarded by an equality check, so
 * it settles on the next pass.
 */
export function useLastLoaded<T>(value: T | undefined): {
  /** The freshest value there is — the new one, or the last one that loaded. */
  data: T | undefined
  /** A newer value is in flight. Show it as stale, do not hide it. */
  loading: boolean
} {
  const [kept, setKept] = useState(value)
  if (value !== undefined && value !== kept) {
    setKept(value)
  }
  return { data: value ?? kept, loading: value === undefined }
}
