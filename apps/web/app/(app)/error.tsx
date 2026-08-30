"use client"

import { ErrorPanel } from "@/components/error-panel"

/**
 * The shell's error boundary.
 *
 * Inside `(app)` rather than at the root, so a thrown query loses the page and
 * keeps the rail: someone whose claim query failed can still reach their
 * notifications, and the way out is one click rather than a back button.
 *
 * Every screen here subscribes to Convex, and a Convex query reports failure by
 * throwing into React. Without a boundary that unmounts the whole route,
 * leaving a blank page — and the person on the other side of it is usually
 * bereaved, mid-claim, and in no mood to guess.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorPanel error={error} reset={reset} />
}
