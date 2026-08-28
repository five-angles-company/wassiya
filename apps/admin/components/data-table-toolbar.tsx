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
import type { ReactNode } from "react"
import type { RowData } from "@tanstack/react-table"
import { ChevronDownIcon, InfoIcon, XIcon } from "lucide-react"

import {
  DataTableFacetedFilter,
  type FacetOption,
} from "@/components/data-table-faceted-filter"
import type { DataTableInstance } from "@/lib/data-table-features"
import type { ServerTable } from "@/lib/data-table-server"
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
export type CappedWindow = {
  cap: number
  /** Which slice was truncated — "some of this is missing" is useless alone. */
  detail?: string
}

type DataTableToolbarProps<TData extends RowData> = {
  table: DataTableInstance<TData>
  labels: DataTableLabels
  columnLabels: Record<string, string>
  facets: DataTableFacet[]
  capped: CappedWindow | undefined
  server: ServerTable | undefined
  /**
   * Whether this table has anything to search.
   *
   * Removed once as unused and restored when heirs and devices arrived: both
   * are server-paginated with no search index behind them, so a box could only
   * ever filter the page in front of you while appearing to search the set. A
   * control that quietly means less than it looks like is worse than its
   * absence.
   */
  searchable: boolean
  /**
   * Overrides the generic placeholder where the search means something
   * narrower — an exact-match lookup, or a subset of the columns. A box that
   * quietly matches less than it appears to is reported as broken.
   */
  searchPlaceholder: string | undefined
  /**
   * Filters the **caller** owns, rendered ahead of the column facets.
   *
   * For controls that change what gets fetched rather than what gets shown.
   * They sit first because that is the order they apply in: the server decides
   * which rows exist here, then the facets narrow what survived.
   */
  filters: ReactNode
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
  filters,
  server,
  searchable,
  searchPlaceholder,
}: DataTableToolbarProps<TData>) {
  // `table.state`, not v8's `getState()`. The shell omits `useTable`'s selector,
  // so every registered slice is present here.
  const search = server?.search ?? (table.state.globalFilter as string) ?? ""
  const setSearch = (value: string) => {
    if (server !== undefined) server.onSearchChange(value)
    else table.setGlobalFilter(value)
  }
  const filtered = search.length > 0 || table.state.columnFilters.length > 0

  return (
    <div className="flex flex-wrap items-center gap-2">
      {searchable && (
        <div className="relative">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder ?? labels.search}
            className="w-56 pe-8"
          />
          {search.length > 0 && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={labels.clearSearch}
              className="absolute end-1 top-1/2 -translate-y-1/2"
              onClick={() => setSearch("")}
            >
              <XIcon className="size-3.5" aria-hidden />
            </Button>
          )}
        </div>
      )}

      {filters}

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
            setSearch("")
            table.resetColumnFilters()
          }}
        >
          {labels.resetFilters}
          <XIcon className="size-3.5" aria-hidden />
        </Button>
      )}

      {/* Why the sort headers went inert. A Convex search ranks its results
          and that ordering cannot be replaced, so this is a property of the
          search rather than a bug in the header. */}
      {server?.sortLocked === true && (
        <Badge
          variant="outline"
          className="gap-1 font-normal text-muted-foreground"
        >
          <InfoIcon className="size-3.5 shrink-0" aria-hidden />
          {labels.sortedByRelevance}
        </Badge>
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
            {capped.detail ??
              labels.cappedSearchHint.replace("{n}", String(capped.cap))}
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
