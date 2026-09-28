import type { ReactNode } from "react"

/** One label/value row in the report's details. */
export function ClaimFact({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 flex-col gap-0.5">{children}</dd>
    </div>
  )
}
