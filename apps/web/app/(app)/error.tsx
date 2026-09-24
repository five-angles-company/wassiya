"use client"

import { ErrorPanel } from "@/components/error-panel"

/** Errors on the signed-in screens, inside the group's column. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorPanel error={error} reset={reset} inColumn={false} />
}
