"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import type { RowData } from "@tanstack/react-table"
import { ChevronDownIcon, InfoIcon, XIcon } from "lucide-react"

import {
  DataTableFacetedFilter,
  type FacetOption,
} from "@/components/data-table-faceted-filter"
import type { DataTableInstance } from "@/lib/data-table-features"
import type { Resolved } from "@/lib/i18n/locale"
import type { DATA_TABLE } from "@/lib/i18n/strings/data-table"

export type DataTableLabels = Resolved<typeof DATA_TABLE>

/** One faceted filter, described by the caller in its own language. */
export type DataTableFacet = {
  columnId: string
  title: string
  options: FacetOption[]
}

/**
 * How much of the table the server actually sent.
 *
 * Present only when the query hit its cap, because that is the only time it
 * changes what the operator should believe about an empty search result.
 */
export type CappedWindow = { cap: number }

type DataTableToolbarProps<TData extends RowData> = {
  table: DataTableInstance<TData>
  labels: DataTableLabels
  columnLabels: Record<string, string>
  facets: DataTableFacet[]
  capped: CappedWindow | undefined
}

/**
 * Search, facets, and column visibility.
 *
 * ## The capped-window notice is not decoration
 *
 * The search box filters **rows already loaded**, and `admin.claimsByStatus`
 * stops at 100 per status. Without the notice beside it, an operator types a
 * claimant's name, gets nothing back, and reasonably concludes no such claim
 * exists — when it is sitting at row 140 on the server. That failure is silent,
 * looks exactly like a correct answer, and no type or test catches it.
 *
 * So it renders next to the input rather than under the table: it has to be in
 * the operator's eye at the moment they read the result, not somewhere they
 * would scroll to afterwards.
 */
export function DataTableToolbar<TData extends RowData>({
  table,
  labels,
  columnLabels,
  facets,
  capped,
}: DataTableToolbarProps<TData>) {
  // `table.state`, not v8's `getState()`. The shell omits `useTable`'s selector,
  // so every registered slice is present here.
  const search = (table.state.globalFilter as string) ?? ""
  const filtered = search.length > 0 || table.state.columnFilters.length > 0

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Input
          value={search}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          placeholder={labels.search}
          className="w-56 pe-8"
        />
        {search.length > 0 && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={labels.clearSearch}
            className="absolute end-1 top-1/2 -translate-y-1/2"
            onClick={() => table.setGlobalFilter("")}
          >
            <XIcon className="size-3.5" aria-hidden />
          </Button>
        )}
      </div>

      {facets.map((facet) => (
        <DataTableFacetedFilter
          key={facet.columnId}
          column={table.getColumn(facet.columnId)}
          title={facet.title}
          options={facet.options}
          clearLabel={labels.resetFilters}
        />
      ))}

      {filtered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            table.setGlobalFilter("")
            table.resetColumnFilters()
          }}
        >
          {labels.resetFilters}
          <XIcon className="size-3.5" aria-hidden />
        </Button>
      )}

      {capped !== undefined && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="gap-1 font-normal text-muted-foreground"
            >
              <InfoIcon className="size-3.5 shrink-0" aria-hidden />
              {labels.cappedSearch.replace("{n}", String(capped.cap))}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            {labels.cappedSearchHint.replace("{n}", String(capped.cap))}
          </TooltipContent>
        </Tooltip>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="ms-auto">
            {labels.columns}
            <ChevronDownIcon className="size-3.5" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  onSelect={(event) => event.preventDefault()}
                >
                  {columnLabels[column.id] ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
