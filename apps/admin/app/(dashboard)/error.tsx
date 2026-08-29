"use client"

import { ErrorPanel } from "@/components/error-panel"

/**
 * The console's error boundary.
 *
 * Placed inside the `(dashboard)` group rather than at the root on purpose: an
 * `error.tsx` replaces its segment's *children*, so the layout above it
 * survives. A screen that fails keeps the sidebar and the header, and the
 * operator moves on with one click instead of reaching for the back button.
 *
 * It exists because every screen here is a live Convex subscription and a
 * failing query throws into React. Until now nothing caught that, so a single
 * refused query — a session that lost its role, a deployment mid-push — took
 * the whole route down to a blank page.
 *
 * A root `global-error.tsx` sits behind this one for the case it cannot reach:
 * a throw in the root layout itself, before this boundary is mounted.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorPanel error={error} reset={reset} />
}
