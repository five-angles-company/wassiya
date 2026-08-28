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
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import type { FunctionReturnType } from "convex/server"
import { MoreHorizontalIcon } from "lucide-react"

import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { IdentityBadge } from "@/components/identity-badge"
import { OWNERS } from "@/features/owners/strings/owners"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtBytes, fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

export type OwnerRow = FunctionReturnType<
  typeof api.admin.ownersPage
>["page"][number]

const helper = createColumnHelper<DataTableFeatures, OwnerRow>()

export function ownerColumns(
  locale: Locale
): ColumnDef<DataTableFeatures, OwnerRow>[] {
  const labels = t(OWNERS, locale)

  return helper.columns([
    helper.accessor("name", {
      id: "owner",
      enableSorting: false,
      header: () => labels.colOwner,
      cell: ({ row }) => (
        <Link
          href={`/owners/${row.original.id}`}
          className="flex flex-col hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          <span className="font-medium">
            {row.original.name ?? (
              <span className="text-muted-foreground">{labels.nameNone}</span>
            )}
          </span>
          <span dir="ltr" className="inline-block text-xs text-muted-foreground">
            {row.original.email}
          </span>
        </Link>
      ),
    }),

    helper.accessor("identityStatus", {
      id: "identity",
      enableSorting: false,
      header: () => labels.colIdentity,
      cell: ({ row }) => (
        <IdentityBadge status={row.original.identityStatus} locale={locale} />
      ),
    }),

    helper.accessor("plan", {
      id: "plan",
      enableSorting: false,
      header: () => labels.colPlan,
      cell: ({ row }) =>
        row.original.plan === null ? (
          <span className="text-muted-foreground">{labels.planNone}</span>
        ) : (
          <Badge variant="outline">{row.original.plan}</Badge>
        ),
    }),

    helper.accessor("country", {
      id: "country",
      enableSorting: false,
      header: () => labels.colCountry,
      cell: ({ row }) =>
        row.original.country ?? (
          <span className="text-muted-foreground">{labels.none}</span>
        ),
    }),

    helper.accessor("storageBytesUsed", {
      id: "storage",
      enableSorting: false,
      header: () => labels.colStorage,
      cell: ({ row }) => (
        <span className="tabular-nums">
          {fmtBytes(row.original.storageBytesUsed, locale)}
        </span>
      ),
    }),

    helper.accessor("joinedAt", {
      id: "joinedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colJoined} />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {fmtDate(row.original.joinedAt, locale)}
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
            className="w-52"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`/owners/${row.original.id}`}>
                  {labels.actionOpen}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={row.original.email === null}
                onClick={() =>
                  void navigator.clipboard.writeText(row.original.email ?? "")
                }
              >
                {labels.actionCopyEmail}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ])
}

/** Column id → label, for the visibility menu. */
export function ownerColumnLabels(locale: Locale): Record<string, string> {
  const labels = t(OWNERS, locale)
  return {
    owner: labels.colOwner,
    identity: labels.colIdentity,
    plan: labels.colPlan,
    country: labels.colCountry,
    storage: labels.colStorage,
    joinedAt: labels.colJoined,
    actions: labels.colActions,
  }
}
