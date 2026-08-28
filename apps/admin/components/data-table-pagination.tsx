"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import type { RowData } from "@tanstack/react-table"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"

import { PAGE_SIZES, type DataTableInstance } from "@/lib/data-table-features"
import type { ServerTable } from "@/lib/data-table-server"
import type { DataTableLabels } from "@/components/data-table-toolbar"
import { fmtNumber } from "@/lib/format"
import type { Locale } from "@/lib/i18n/locale"

type DataTablePaginationProps<TData extends RowData> = {
  table: DataTableInstance<TData>
  labels: DataTableLabels
  locale: Locale
  server: ServerTable | undefined
}

/**
 * Page size, position, and the four steps.
 *
 * The arrows are mirrored by the writing direction rather than by the icon: in
 * RTL, `ChevronLeft` points the way "next" travels, so the icons are assigned
 * by *role* and the row is laid out by flow. Flipping the glyphs instead would
 * put a left-pointing chevron on a button that moves right in English.
 *
 * ## Two shapes, because two kinds of pagination exist here
 *
 * Client-side, the table knows every row it holds, so it can say "page 3 of
 * 12". Server-side it cannot: Convex pagination is a cursor stream and a page
 * knows only whether another follows it. So the server shape says "page 3" and
 * borrows a **bounded** total — `500+` past the cap — rather than inventing a
 * page count. Both are honest about a different amount of knowledge, and the
 * one thing neither may do is guess.
 */
export function DataTablePagination<TData extends RowData>({
  table,
  labels,
  locale,
  server,
}: DataTablePaginationProps<TData>) {
  const pageCount = table.getPageCount()
  const { pageIndex, pageSize } = table.state.pagination
  const rowCount = table.getRowCount()

  if (server !== undefined) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums">
          {server.total === undefined
            ? ""
            : labels.rowCount.replace(
                "{n}",
                `${fmtNumber(server.total.count, locale)}${server.total.more ? "+" : ""}`
              )}
        </p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {labels.rowsPerPage}
            </span>
            <Select
              value={String(server.pageSize)}
              onValueChange={(value) => server.onPageSizeChange(Number(value))}
            >
              <SelectTrigger size="sm" className="w-[4.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {fmtNumber(size, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
            {labels.pageNumber.replace(
              "{page}",
              fmtNumber(server.page, locale)
            )}
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={labels.previous}
              onClick={server.onPrev}
              disabled={!server.canPrev || server.loading}
            >
              <ChevronLeftIcon className="size-4 rtl:rotate-180" aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={labels.next}
              onClick={server.onNext}
              disabled={!server.canNext || server.loading}
            >
              <ChevronRightIcon className="size-4 rtl:rotate-180" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground tabular-nums">
        {labels.rowCount.replace("{n}", fmtNumber(rowCount, locale))}
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {labels.rowsPerPage}
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" className="w-[4.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {fmtNumber(size, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
          {labels.pageOf
            .replace("{page}", fmtNumber(pageIndex + 1, locale))
            .replace("{total}", fmtNumber(Math.max(pageCount, 1), locale))}
        </p>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={labels.firstPage}
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeftIcon className="size-4 rtl:rotate-180" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={labels.previous}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon className="size-4 rtl:rotate-180" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={labels.next}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRightIcon className="size-4 rtl:rotate-180" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={labels.lastPage}
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRightIcon className="size-4 rtl:rotate-180" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}
