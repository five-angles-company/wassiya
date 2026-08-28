"use client"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import type { Column, RowData } from "@tanstack/react-table"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"

import type { DataTableFeatures } from "@/lib/data-table-features"

/**
 * `TValue` is generic rather than left to default.
 *
 * `Column<F, TData>` defaults its value type to `CellData`, which v9 aliases to
 * `unknown` — and a `Column<…, string>` is not assignable to a
 * `Column<…, unknown>` because the type is invariant in that position. Every
 * typed accessor column would be rejected at the call site. Inferring it here
 * costs one type parameter and accepts them all.
 */
type DataTableColumnHeaderProps<TData extends RowData, TValue> = {
  column: Column<DataTableFeatures, TData, TValue>
  title: string
  className?: string
}

/**
 * A sortable header cell.
 *
 * Every column previously repeated this button inline, which is how two of them
 * ended up sortable and three did not for no reason anyone chose. The icon is
 * the affordance: neutral when unsorted, directional once it is, so the current
 * sort is legible without reading the column back.
 *
 * A column that opts out of sorting renders as plain text rather than a dead
 * button — `getCanSort()` already knows, so nothing has to be passed in.
 */
export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span className={cn("text-muted-foreground", className)}>{title}</span>
  }

  const sorted = column.getIsSorted()
  const Icon =
    sorted === "asc" ? ArrowUpIcon : sorted === "desc" ? ArrowDownIcon : ArrowUpDownIcon

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ms-2 h-8 data-[state=open]:bg-accent", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {title}
      <Icon
        className={cn("size-3.5", sorted ? "opacity-100" : "opacity-50")}
        aria-hidden
      />
    </Button>
  )
}
