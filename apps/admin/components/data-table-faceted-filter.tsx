"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import type { Column, RowData } from "@tanstack/react-table"
import { PlusCircleIcon } from "lucide-react"

import type { DataTableFeatures } from "@/lib/data-table-features"

/** One selectable value, already localised by the caller. */
export type FacetOption = { value: string; label: string }

type FacetedFilterProps = {
  title: string
  options: FacetOption[]
  selected: ReadonlySet<string>
  onToggle: (value: string, checked: boolean) => void
  onClear: () => void
  /**
   * Rows behind each value, already formatted, or `undefined` for no count.
   *
   * A string rather than a number so a caller can render a *bounded* tally.
   * The console's counts come from `overview`, which stops counting at 100 and
   * reports `100+` — rendering that as the number `100` would be a quiet lie
   * about how much work is in the queue.
   */
  count: (value: string) => string | undefined
  clearLabel: string
}

/**
 * The multi-select filter, as pure presentation.
 *
 * Split out from the column-bound version below so a **server-side** filter can
 * wear the same control. That matters more than reuse: a toolbar where one
 * filter is a dropdown of checkboxes and its neighbour is a row of chips
 * teaches an operator that the two do different kinds of thing, when the only
 * real difference is which layer applies them.
 *
 * Built on `DropdownMenu` rather than the Popover + Command combobox shadcn
 * uses, because neither of those is installed and a filter over four to six
 * known values does not need a search field inside it. When one grows past what
 * a menu can hold, that is the moment to add them — not before.
 */
export function FacetedFilter({
  title,
  options,
  selected,
  onToggle,
  onClear,
  count,
  clearLabel,
}: FacetedFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          <PlusCircleIcon className="size-3.5" aria-hidden />
          {title}
          {selected.size > 0 && (
            <Badge variant="secondary" className="ms-1 tabular-nums">
              {selected.size}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuGroup>
          {options.map((option) => {
            const tally = count(option.value)
            return (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={selected.has(option.value)}
                onCheckedChange={(checked) => onToggle(option.value, !!checked)}
                onSelect={(event) => event.preventDefault()}
              >
                <span className="flex-1">{option.label}</span>
                {tally !== undefined && (
                  <span className="ms-2 text-xs text-muted-foreground tabular-nums">
                    {tally}
                  </span>
                )}
              </DropdownMenuCheckboxItem>
            )
          })}
        </DropdownMenuGroup>
        {selected.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onClear}
              className="justify-center text-sm"
            >
              {clearLabel}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type DataTableFacetedFilterProps<TData extends RowData> = {
  column: Column<DataTableFeatures, TData> | undefined
  title: string
  options: FacetOption[]
  clearLabel: string
}

/**
 * A facet bound to one column's discrete values.
 *
 * Counts come from `getFacetedUniqueValues()`, which counts across the rows
 * surviving *other* columns' filters. So ticking one facet updates the numbers
 * on the others, and a value that no longer occurs reads as `0` rather than
 * vanishing — which is what tells an operator their filters have combined into
 * something empty.
 */
export function DataTableFacetedFilter<TData extends RowData>({
  column,
  title,
  options,
  clearLabel,
}: DataTableFacetedFilterProps<TData>) {
  if (column === undefined) return null

  const facets = column.getFacetedUniqueValues()
  const selected = new Set((column.getFilterValue() as string[]) ?? [])

  return (
    <FacetedFilter
      title={title}
      options={options}
      selected={selected}
      count={(value) => String(facets.get(value) ?? 0)}
      clearLabel={clearLabel}
      onClear={() => column.setFilterValue(undefined)}
      onToggle={(value, checked) => {
        const next = new Set(selected)
        if (checked) next.add(value)
        else next.delete(value)
        // An empty array would filter everything out; `undefined` is how this
        // feature spells "no opinion".
        column.setFilterValue(next.size === 0 ? undefined : Array.from(next))
      }}
    />
  )
}
