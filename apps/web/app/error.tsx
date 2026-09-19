"use client"

import { ErrorPanel } from "@/components/error-panel"

/**
 * The site's error boundary.
 *
 * At the root rather than inside `(claim)`, because there is no shell above the
 * route worth preserving — every screen here is full-page — and because the
 * delivery area will want the same treatment without a second copy.
 *
 * `global-error.tsx` sits behind it for the one case it cannot reach: a throw
 * in the root layout itself, before this is mounted.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorPanel error={error} reset={reset} />
}
