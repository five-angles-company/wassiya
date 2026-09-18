"use client"

import type { ReactNode } from "react"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import type { RowData } from "@tanstack/react-table"
import { CopyIcon, DownloadIcon, XIcon } from "lucide-react"

import type { DataTableLabels } from "@/components/data-table-toolbar"
import type { DataTableInstance } from "@/lib/data-table-features"
import { downloadCsv, toCsv, type CsvColumn } from "@/lib/csv"
import { fmtNumber } from "@/lib/format"
import type { Locale } from "@/lib/i18n/locale"

/** What a table exports, and what "the id" means for its rows. */
export type BulkConfig<TData> = {
  /** Filename stem — the row count and extension are appended. */
  exportName: string
  csvColumns: readonly CsvColumn<TData>[]
  rowId: (row: TData) => string
  /**
   * Extra actions for this table, rendered after the built-ins.
   *
   * **Read-only by construction.** Nothing that changes a claim belongs here —
   * see `data-table-features.ts` for why a bulk verdict is unavailable rather
   * than merely absent.
   */
  extra?: (rows: TData[]) => ReactNode
}

type DataTableBulkBarProps<TData extends RowData> = {
  table: DataTableInstance<TData>
  labels: DataTableLabels
  locale: Locale
  config: BulkConfig<TData>
}

/**
 * The bar that appears once rows are selected.
 *
 * It replaces nothing and covers nothing — it sits above the table, so the rows
 * an operator picked stay visible while they choose what to do with them.
 *
 * Both built-in actions read. Copy puts the ids on the clipboard for pasting
 * into a ticket; export writes a CSV of the selection. Neither touches the
 * deployment, which is the point: this console reviews inheritance claims, and
 * a mis-aimed bulk write here is not an inconvenience but an heir permanently
 * locked out of an estate.
 */
export function DataTableBulkBar<TData extends RowData>({
  table,
  labels,
  locale,
  config,
}: DataTableBulkBarProps<TData>) {
  const selected = table.getSelectedRowModel().rows.map((row) => row.original)
  if (selected.length === 0) return null

  return (
    // No border or rounding of its own: it sits in a bordered band inside the
    // table's card, and a second outline around it would read as a dialog
    // floating over the rows rather than a strip belonging to them.
    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/50 px-3 py-2">
      <span className="text-sm font-medium tabular-nums">
        {labels.selectedCount.replace(
          "{n}",
          fmtNumber(selected.length, locale)
        )}
      </span>

      <Separator
        orientation="vertical"
        className="mx-1 h-5 data-[orientation=vertical]:self-center"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          void navigator.clipboard.writeText(
            selected.map(config.rowId).join("\n")
          )
        }
      >
        <CopyIcon className="size-3.5" aria-hidden />
        {labels.copyIds}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          downloadCsv(
            `${config.exportName}-${selected.length}.csv`,
            toCsv(selected, config.csvColumns)
          )
        }
      >
        <DownloadIcon className="size-3.5" aria-hidden />
        {labels.exportCsv}
      </Button>

      {config.extra?.(selected)}

      <Button
        variant="ghost"
        size="sm"
        className="ms-auto"
        onClick={() => table.resetRowSelection()}
      >
        {labels.clearSelection}
        <XIcon className="size-3.5" aria-hidden />
      </Button>
    </div>
  )
}
