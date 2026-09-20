"use client"

import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  createColumnHelper,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table"

import type { DataTableFeatures } from "@/lib/data-table-features"
import type { DataTableLabels } from "@/components/data-table-toolbar"

/**
 * The leading checkbox column.
 *
 * A factory rather than a constant because it is typed to the row and carries
 * localised labels — and because every table that wants selection should get an
 * identical one instead of hand-rolling a fifth variant of a checkbox cell.
 *
 * The header selects **this page**, not the whole filtered set. That is the
 * honest affordance: a "select all 100" that reaches rows the operator has not
 * seen is how a bulk action ends up applied to something nobody looked at. It
 * also matches what the checkbox visibly sits above.
 *
 * `enableHiding: false` keeps it out of the column-visibility menu — hiding the
 * checkboxes while a selection is live would strand rows selected and
 * unreachable.
 */
export function selectColumn<TData extends RowData>(
  labels: DataTableLabels
): ColumnDef<DataTableFeatures, TData> {
  const helper = createColumnHelper<DataTableFeatures, TData>()

  return helper.display({
    id: "select",
    enableHiding: false,
    enableSorting: false,
    enableGlobalFilter: false,
    header: ({ table }) => (
      <Checkbox
        aria-label={labels.selectAll}
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={labels.selectRow}
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        className="translate-y-[2px]"
        // A row is a link to its review screen; ticking it must not navigate.
        onClick={(event) => event.stopPropagation()}
      />
    ),
  })
}
