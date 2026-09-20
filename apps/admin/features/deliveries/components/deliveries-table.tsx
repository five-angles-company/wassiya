"use client"

import { useMemo } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import type { FunctionReturnType } from "convex/server"
import { useQuery } from "convex/react"
import { PackageOpenIcon, XIcon } from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"

import { DataTable } from "@/components/data-table"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { useLocale } from "@/components/locale-provider"
import { DeliverySheet } from "@/features/deliveries/components/delivery-sheet"
import {
  DELIVERY_STATUSES,
  channelLabel,
  outcomeLabel,
  statusLabel,
  statusVariant,
} from "@/features/deliveries/lib/labels"
import { DELIVERIES } from "@/features/deliveries/strings/deliveries"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"

type Row = FunctionReturnType<typeof api.deliveries.adminTable>["rows"][number]

const helper = createColumnHelper<DataTableFeatures, Row>()

function deliveryColumns(locale: Locale): ColumnDef<DataTableFeatures, Row>[] {
  const labels = t(DELIVERIES, locale)
  return helper.columns([
    helper.accessor(
      (row) => `${row.heirName ?? ""} ${row.heirRelation ?? ""}`,
      {
        id: "heir",
        enableSorting: false,
        header: () => labels.colHeir,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.heirName ?? "—"}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.heirRelation}
            </span>
          </div>
        ),
      }
    ),
    helper.accessor((row) => row.subjectName ?? "", {
      id: "owner",
      enableSorting: false,
      header: () => labels.colOwner,
      cell: ({ row }) => row.original.subjectName ?? "—",
    }),
    helper.accessor("status", {
      id: "status",
      filterFn: "arrIncludesSome",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colStatus} />
      ),
      cell: ({ row }) => {
        const needsDecision =
          row.original.status === "identity_pending" &&
          row.original.boundVerified
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant={statusVariant(row.original.status)}
              className="whitespace-nowrap"
            >
              {statusLabel(row.original.status, locale)}
            </Badge>
            {needsDecision && (
              <Badge variant="destructive" className="whitespace-nowrap">
                {labels.needsDecision}
              </Badge>
            )}
          </div>
        )
      },
    }),
    helper.accessor((row) => row.lastContact?.at ?? 0, {
      id: "contact",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colContact} />
      ),
      cell: ({ row }) => {
        const last = row.original.lastContact
        if (last === null) {
          return (
            <span className="text-sm text-muted-foreground">
              {labels.neverContacted}
            </span>
          )
        }
        return (
          <div className="flex flex-col">
            <span className="text-sm">
              {channelLabel(last.channel, locale)} ·{" "}
              {outcomeLabel(last.outcome, locale)}
            </span>
            <span className="text-xs text-muted-foreground">
              {fmtDate(last.at, locale)}
            </span>
          </div>
        )
      },
    }),
    helper.accessor("expiresAt", {
      id: "expiresAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colExpires} />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {fmtDate(row.original.expiresAt, locale)}
        </span>
      ),
    }),
  ])
}

/**
 * Every delivery, one row per heir, worked from a side sheet so the queue
 * stays in view. "Needs a decision" is its own badge because it is the only
 * state where an heir is waiting on staff rather than on themselves.
 *
 * `?claim=` narrows to one report — the claim page links here that way.
 * `?delivery=` is the open sheet, so a row can be linked to directly.
 */
export function DeliveriesTable() {
  const locale = useLocale()
  const labels = useMemo(() => t(DELIVERIES, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])
  const [claim, setClaim] = useQueryState("claim", parseAsString)
  const [open, setOpen] = useQueryState("delivery", parseAsString)

  const result = useQuery(api.deliveries.adminTable, {})
  const columns = useMemo(() => deliveryColumns(locale), [locale])
  const columnLabels = useMemo(
    () => ({
      heir: labels.colHeir,
      owner: labels.colOwner,
      status: labels.colStatus,
      contact: labels.colContact,
      expiresAt: labels.colExpires,
    }),
    [labels]
  )
  const rows = useMemo(
    () =>
      result === undefined
        ? undefined
        : claim === null
          ? result.rows
          : result.rows.filter((row) => row.claimId === claim),
    [result, claim]
  )

  if (rows === undefined) {
    return <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
  }

  return (
    <>
      {claim !== null && (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline">{labels.filteredToClaim}</Badge>
          <Button variant="ghost" size="sm" onClick={() => void setClaim(null)}>
            <XIcon />
            {labels.clearClaim}
          </Button>
        </div>
      )}
      <DataTable<Row>
        columns={columns}
        data={rows}
        fill
        searchPlaceholder={labels.searchPlaceholder}
        labels={tableLabels}
        locale={locale}
        columnLabels={columnLabels}
        getRowId={(row) => row.deliveryId}
        onRowClick={(row) => void setOpen(row.deliveryId)}
        facets={[
          {
            columnId: "status",
            title: labels.colStatus,
            options: DELIVERY_STATUSES.map((value) => ({
              value,
              label: statusLabel(value, locale),
            })),
          },
        ]}
        capped={result?.capped ? { cap: rows.length } : undefined}
        empty={
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <PackageOpenIcon className="size-6 text-muted-foreground" />
            <span className="font-medium">{labels.empty}</span>
            <span className="max-w-sm text-sm text-muted-foreground">
              {labels.emptyHint}
            </span>
          </div>
        }
      />
      <DeliverySheet
        deliveryId={open as Id<"deliveries"> | null}
        locale={locale}
        onClose={() => void setOpen(null)}
      />
    </>
  )
}
