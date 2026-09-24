"use client"

import { ErrorPanel } from "@/components/error-panel"

/** Errors on the report, delivery and help screens, inside the group's column. */
export default function CaseError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorPanel error={error} reset={reset} inColumn={false} />
}
