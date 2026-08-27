"use client"

import type { ReactNode } from "react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { useTable, type ColumnDef, type RowData } from "@tanstack/react-table"
import { ChevronDownIcon } from "lucide-react"

import { features, type DataTableFeatures } from "@/lib/data-table-features"

export type DataTableLabels = {
  filterPlaceholder: string
  columns: string
  previous: string
  next: string
  /** Column id → human label, for the visibility menu. */
  columnLabels: Record<string, string>
}

type DataTableProps<TData extends RowData> = {
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
  /** Which column the toolbar's search box filters. */
  filterColumnId: string
  labels: DataTableLabels
  /** Rendered in place of rows when there are none. */
  empty: ReactNode
  /**
   * Drop the toolbar, the pagination and the outer border.
   *
   * The dashboard shows a short, pre-sliced list inside a `TableCard`, where a
   * filter box over five rows is furniture and a pager over one page is a lie.
   * The card already supplies the border, so the table draws flat inside it.
   */
  compact?: boolean
}

/**
 * The console's one table.
 *
 * Written against TanStack Table **v9**: `useTable` holds its own state in
 * store atoms, so there are no `useState` pairs and no `state`/`onChange`
 * plumbing to keep in sync — the v8 shape most examples show. Header and cell
 * markup goes through `table.FlexRender`, which replaces the old top-level
 * `flexRender(def, ctx)` call.
 *
 * Nothing here is claim-specific. The queue supplies its own columns and
 * labels, so the second table this console grows costs a columns file.
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  filterColumnId,
  labels,
  empty,
  compact = false,
}: DataTableProps<TData>) {
  const table = useTable({ features, data, columns })

  const rows = table.getRowModel().rows
  const filterColumn = table.getColumn(filterColumnId)

  return (
    <div className="flex w-full flex-col gap-3">
      {!compact && (
        <div className="flex items-center gap-2">
          <Input
            value={(filterColumn?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              filterColumn?.setFilterValue(event.target.value)
            }
            placeholder={labels.filterPlaceholder}
            className="max-w-xs"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ms-auto">
                {labels.columns}
                <ChevronDownIcon />
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
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {labels.columnLabels[column.id] ?? column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div
        className={
          compact ? "overflow-x-auto" : "overflow-x-auto rounded-xl border"
        }
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-start">
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-40">
                  {empty}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!compact && table.getPageCount() > 1 && (
        <div className="flex items-center justify-end gap-2 px-1 pb-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {labels.previous}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {labels.next}
          </Button>
        </div>
      )}
    </div>
  )
}
