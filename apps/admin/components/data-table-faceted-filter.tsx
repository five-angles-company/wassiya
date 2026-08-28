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

type DataTableFacetedFilterProps<TData extends RowData> = {
  column: Column<DataTableFeatures, TData> | undefined
  title: string
  options: FacetOption[]
  clearLabel: string
}

/**
 * A multi-select filter over one column's discrete values.
 *
 * Built on `DropdownMenu` rather than the Popover + Command combobox shadcn
 * uses for this, because neither of those components is installed and a facet
 * over four or five known values does not need a search field inside it. When a
 * facet grows past what a menu can hold, that is the moment to add them — not
 * before.
 *
 * The counts come from `getFacetedUniqueValues()`, which counts across the rows
 * that survive *other* columns' filters. So ticking one facet updates the
 * numbers on the others, and a value that no longer occurs reads as `0` rather
 * than vanishing — which is what tells an operator their filters have combined
 * into something empty.
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

  function toggle(value: string, checked: boolean) {
    const next = new Set(selected)
    if (checked) next.add(value)
    else next.delete(value)
    // An empty array would filter everything out; `undefined` is how this
    // feature spells "no opinion".
    column?.setFilterValue(next.size === 0 ? undefined : Array.from(next))
  }

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
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={selected.has(option.value)}
              onCheckedChange={(checked) => toggle(option.value, !!checked)}
              onSelect={(event) => event.preventDefault()}
            >
              <span className="flex-1">{option.label}</span>
              <span className="ms-2 text-xs tabular-nums text-muted-foreground">
                {facets.get(option.value) ?? 0}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        {selected.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => column.setFilterValue(undefined)}
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
