"use client"

import Link from "next/link"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import type { FunctionReturnType } from "convex/server"
import { MoreHorizontalIcon } from "lucide-react"

import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { selectColumn } from "@/components/data-table-select-column"
import type { DataTableLabels } from "@/components/data-table-toolbar"
import { IdentityBadge } from "@/features/claims/components/identity-badge"
import { claimStatusLabel } from "@/features/claims/lib/status"
import { CLAIMS } from "@/features/claims/strings/claims"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

/**
 * One row of the workspace, as `admin.claimsByStatus` returns it.
 *
 * Deliberately **not** the same type as `PendingClaim` in `claims-columns.tsx`,
 * and not merged with it. The dashboard's queue reads `claims.pendingReview`,
 * which resolves a certificate URL and only ever returns `submitted`; this
 * query spans all six statuses and carries `heirLinked`, `nameMatch` and
 * `vetoDeadline` instead. Folding them into one type with optional fields
 * would make every cell defensive about facts that are always present in one
 * table and never present in the other.
 */
export type BrowsedClaim = FunctionReturnType<
  typeof api.admin.claimsByStatus
>["rows"][number]

const helper = createColumnHelper<DataTableFeatures, BrowsedClaim>()

export function claimBrowserColumns(
  locale: Locale,
  tableLabels: DataTableLabels
): ColumnDef<DataTableFeatures, BrowsedClaim>[] {
  const labels = t(CLAIMS, locale)

  return helper.columns([
    selectColumn<BrowsedClaim>(tableLabels),

    helper.accessor("claimantName", {
      id: "claimantName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colClaimant} />
      ),
      cell: ({ row }) => (
        <Link
          href={`/claims/${row.original.id}`}
          className="flex flex-col hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          <span className="font-medium">{row.original.claimantName}</span>
          {/* An email or phone stays LTR inside Arabic prose. */}
          <span dir="ltr" className="inline-block text-xs text-muted-foreground">
            {row.original.claimantContact}
          </span>
        </Link>
      ),
    }),

    // Not faceted, deliberately. Status is chosen in the toolbar and applied by
    // the *query* — see `claims-browser.tsx` — so a column filter here would
    // only be able to narrow within the statuses already fetched, and would
    // silently disagree with the control the operator actually used.
    //
    // The column stays because rows now span statuses: it is what tells a
    // reviewer which slice a given row belongs to, and it carries into the CSV.
    helper.accessor("status", {
      id: "status",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colStatus} />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="whitespace-nowrap">
          {claimStatusLabel(row.original.status, locale)}
        </Badge>
      ),
    }),

    helper.accessor("claimantIdentityStatus", {
      id: "claimantIdentityStatus",
      filterFn: "arrIncludesSome",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colIdentity} />
      ),
      cell: ({ row }) => (
        <IdentityBadge
          status={row.original.claimantIdentityStatus}
          locale={locale}
        />
      ),
    }),

    helper.accessor("subjectVerifiedName", {
      id: "subjectVerifiedName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colOwner} />
      ),
      cell: ({ row }) =>
        row.original.subjectVerifiedName ?? (
          <span className="text-muted-foreground">{labels.ownerNameNone}</span>
        ),
    }),

    // Stored as a boolean, faceted as a string: a facet's values have to be
    // comparable and labellable, and `true`/`false` are neither in Arabic.
    helper.accessor((row) => (row.heirLinked ? "linked" : "unlinked"), {
      id: "heirLinked",
      filterFn: "arrIncludesSome",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colHeir} />
      ),
      cell: ({ row }) => (
        <Badge
          variant={row.original.heirLinked ? "secondary" : "outline"}
          className="whitespace-nowrap"
        >
          {row.original.heirLinked ? labels.heirLinked : labels.heirNotLinked}
        </Badge>
      ),
    }),

    helper.accessor("submittedAt", {
      id: "submittedAt",
      sortFn: "datetime",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colSubmitted} />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {fmtDate(row.original.submittedAt, locale)}
        </span>
      ),
    }),

    helper.display({
      id: "actions",
      enableHiding: false,
      header: () => <span className="sr-only">{labels.colActions}</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="sr-only">{labels.openMenu}</span>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`/claims/${row.original.id}`}>
                  {labels.actionOpen}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() =>
                  void navigator.clipboard.writeText(row.original.id)
                }
              >
                {labels.actionCopyId}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  void navigator.clipboard.writeText(
                    row.original.claimantContact
                  )
                }
              >
                {labels.actionCopyContact}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ])
}

/** Column id → label, for the visibility menu. */
export function claimBrowserColumnLabels(
  locale: Locale
): Record<string, string> {
  const labels = t(CLAIMS, locale)
  return {
    claimantName: labels.colClaimant,
    status: labels.colStatus,
    claimantIdentityStatus: labels.colIdentity,
    subjectVerifiedName: labels.colOwner,
    heirLinked: labels.colHeir,
    submittedAt: labels.colSubmitted,
    actions: labels.colActions,
  }
}
