"use client"

import { useState } from "react"

/**
 * Hold on to the last loaded value while the next one is in flight.
 *
 * ## The problem this exists for
 *
 * Convex's `useQuery` returns `undefined` whenever its **arguments** change,
 * not just on first mount — a new argument is a new subscription. So every
 * filter toggle, every debounced keystroke and every page step briefly returns
 * `undefined`.
 *
 * Rendered naively that produced an unmount, not a flicker: the browsers each
 * had `if (page === undefined) return <Skeleton />`, so changing a filter tore
 * the table down and built a new one. Everything the table owned went with it —
 * the row selection an operator had just made, their column visibility, the
 * sort, and any open menu. The visible symptom is the whole table appearing to
 * rebuild on every keystroke, and the invisible one is worse: a selection
 * silently emptying itself mid-task.
 *
 * Keeping the previous page on screen makes the transition a *refresh* of a
 * table that stays mounted, which is what it always was underneath.
 *
 * ## Why `setState` during render is right here
 *
 * This is React's documented "adjusting state when a prop changes" pattern, and
 * it is deliberately not an effect: an effect would commit the stale value
 * first and then correct it, which is the extra render this avoids. The call is
 * guarded by an equality check, so it settles on the next pass.
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
