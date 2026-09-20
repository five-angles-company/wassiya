"use client"

import type { ReactNode } from "react"
import { Badge } from "@workspace/ui/components/badge"

/**
 * One setting: what it is on the left, its control on the right.
 *
 * Sized for a **full-width panel**, which is the console's rule for anything
 * that is not a table — the dashboard's own note says every panel goes full
 * width where it has room to be read. The label column takes the slack and the
 * control column stays fixed: an input stretched across 1200px is harder to use
 * than one that is not, and a row that spans the panel still reads as one row.
 *
 * `TableCard` draws its content flush, so the padding is here rather than
 * there — the same arrangement its tables use.
 *
 * `source` is the part a plain form cannot show. A box left empty because the
 * environment supplies the value and a box left empty because nothing does look
 * identical, and the difference is whether anything is being sent — so the
 * value actually in force is printed under every control, with where it came
 * from beside it.
 */
export function SettingRow({
  label,
  hint,
  children,
  effective,
  source,
  labels,
}: {
  label: string
  hint?: string
  children: ReactNode
  /** The value in force, already formatted. Omit where there is nothing to say. */
  effective?: string | null
  source?: "env" | "row" | null
  labels: Record<string, string>
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-medium">{label}</span>
        {hint !== undefined && (
          <span className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            {hint}
          </span>
        )}
      </div>

      <div className="flex w-full shrink-0 flex-col gap-1.5 lg:w-96">
        {children}
        {effective !== undefined && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">
              {labels.effective!.replace("{value}", effective ?? labels.unset!)}
            </span>
            {source != null && (
              <Badge variant="outline" className="shrink-0 font-normal">
                {source === "env" ? labels.fromEnv : labels.fromRow}
              </Badge>
            )}
          </span>
        )}
      </div>
    </div>
  )
}

/** Rows inside a panel, hairline-separated, with no rule above the first. */
export function SettingRows({ children }: { children: ReactNode }) {
  return <div className="divide-y">{children}</div>
}

/**
 * A read-only setting — same rhythm as an editable row, without the control.
 *
 * Its own component rather than a `SettingRow` with a `<span>` inside, because
 * the value sits where a control would and should line up with the controls on
 * every other settings screen.
 */
export function SettingFact({
  label,
  hint,
  value,
  badge,
}: {
  label: string
  hint?: string
  value: string
  badge?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 px-4 py-4 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-medium">{label}</span>
        {hint !== undefined && (
          <span className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      <div className="flex w-full shrink-0 items-center gap-2 lg:w-96">
        <span className="font-medium tabular-nums">{value}</span>
        {badge}
      </div>
    </div>
  )
}
