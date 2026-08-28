"use client"

import type { ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
import { useTable, type ColumnDef, type RowData } from "@tanstack/react-table"

import {
  DataTableBulkBar,
  type BulkConfig,
} from "@/components/data-table-bulk-bar"
import { DataTablePagination } from "@/components/data-table-pagination"
import {
  DataTableToolbar,
  type CappedWindow,
  type DataTableFacet,
  type DataTableLabels,
} from "@/components/data-table-toolbar"
import { features, type DataTableFeatures } from "@/lib/data-table-features"
import type { Locale } from "@/lib/i18n/locale"

export type { DataTableFacet, DataTableLabels, CappedWindow }

/**
 * A fresh `[]` on every render invalidates every data-dependent row model, so
 * the fallback is hoisted. TanStack's own getting-started skill calls this out
 * as the common mistake, and `data={query?.rows ?? []}` is exactly its shape.
 */
const EMPTY: never[] = []

type DataTableProps<TData extends RowData> = {
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[] | undefined
  labels: DataTableLabels
  locale: Locale
  /** Column id → human label, for the visibility menu. */
  columnLabels: Record<string, string>
  /** Rendered in place of rows when the source is genuinely empty. */
  empty: ReactNode
  /**
   * Stable identity per row.
   *
   * Not optional when selection is on. Convex re-runs a query on every
   * mutation, so without this the table keys rows by array index and a
   * selection silently moves onto whichever rows happen to land in those
   * positions next.
   */
  getRowId?: (row: TData) => string
  facets?: DataTableFacet[]
  bulk?: BulkConfig<TData>
  /** Set when the server truncated the result — see the toolbar. */
  capped?: CappedWindow
  initialPageSize?: number
  /** Row click target, for tables whose rows open a detail screen. */
  onRowClick?: (row: TData) => void
  /**
   * Drop the toolbar, the pager and the outer border.
   *
   * A dashboard panel shows a short, pre-sliced list inside a `TableCard`,
   * where a search box over five rows is furniture and a pager over one page is
   * a lie. The card supplies the border, so the table draws flat inside it.
   */
  compact?: boolean
}

/**
 * The console's one table.
 *
 * Written against TanStack Table **v9**: `useTable` holds its own state, so
 * there are no `useState` pairs and no `state`/`onChange` plumbing — the v8
 * shape nearly every example still shows. Header and cell markup goes through
 * `table.FlexRender`, which replaces the old top-level `flexRender(def, ctx)`.
 *
 * Nothing here is claim-specific. A second workspace costs a columns file and a
 * facet list; it does not cost another table.
 *
 * ## What "full-featured" does and does not mean here
 *
 * Search, faceting, sorting and paging all run **client-side over the rows the
 * server sent**. That is the right trade for this console — the admin queries
 * are capped in the hundreds and Convex has no count operator, so server-side
 * paging would cost an index per sort column and still not give a page total.
 * It is only honest while the operator can see the cap, which is why `capped`
 * is surfaced in the toolbar rather than left for someone to infer.
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  labels,
  locale,
  columnLabels,
  empty,
  getRowId,
  facets = [],
  bulk,
  capped,
  initialPageSize = 10,
  onRowClick,
  compact = false,
}: DataTableProps<TData>) {
  const table = useTable({
    features,
    data: data ?? (EMPTY as TData[]),
    columns,
    getRowId,
    globalFilterFn: "includesString",
    initialState: {
      pagination: { pageIndex: 0, pageSize: compact ? 100 : initialPageSize },
    },
  })

  const rows = table.getRowModel().rows
  // "Nothing matched" and "nothing exists" are different answers and want
  // different words — the first is the operator's own filter talking.
  const filtered =
    ((table.state.globalFilter as string) ?? "").length > 0 ||
    table.state.columnFilters.length > 0

  return (
    <div className="flex w-full flex-col gap-3">
      {!compact && (
        <DataTableToolbar
          table={table}
          labels={labels}
          columnLabels={columnLabels}
          facets={facets}
          capped={capped}
        />
      )}

      {!compact && bulk !== undefined && (
        <DataTableBulkBar
          table={table}
          labels={labels}
          locale={locale}
          config={bulk}
        />
      )}

      <div className={cn("overflow-x-auto", !compact && "rounded-xl border")}>
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
                  {filtered ? (
                    <div className="flex flex-col items-center justify-center gap-1 text-center">
                      <p className="font-medium">{labels.noResults}</p>
                      <p className="text-sm text-muted-foreground">
                        {labels.noResultsHint}
                      </p>
                    </div>
                  ) : (
                    empty
                  )}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                  className={cn(onRowClick && "cursor-pointer")}
                >
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

      {!compact && rows.length > 0 && (
        <DataTablePagination table={table} labels={labels} locale={locale} />
      )}
    </div>
  )
}
