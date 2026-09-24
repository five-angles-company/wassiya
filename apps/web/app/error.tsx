"use client"

import { ErrorPanel } from "@/components/error-panel"

/** Errors outside the two groups (sign-in, sign-up). The shell stays around it. */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorPanel error={error} reset={reset} />
}
