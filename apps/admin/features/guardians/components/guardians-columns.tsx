"use client"

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
import {
  guardianStateLabel,
  guardianStateVariant,
} from "@/features/guardians/lib/state"
import { GUARDIANS } from "@/features/guardians/strings/guardians"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

export type GuardianRow = FunctionReturnType<
  typeof api.admin.guardiansList
>["rows"][number]

const helper = createColumnHelper<DataTableFeatures, GuardianRow>()

export function guardianColumns(
  locale: Locale
): ColumnDef<DataTableFeatures, GuardianRow>[] {
  const labels = t(GUARDIANS, locale)

  return helper.columns([
    // Accessor is name *and* email joined, because the global filter matches
    // accessor values rather than rendered cells — and the email is the thing
    // an operator has in front of them when they come looking. The cell still
    // reads from `row.original`, so the joined string is never displayed.
    helper.accessor((row) => [row.ownerName, row.ownerEmail].join(" "), {
      id: "owner",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colOwner} />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.original.ownerName ?? (
              <span className="text-muted-foreground">{labels.nameNone}</span>
            )}
          </span>
          <span dir="ltr" className="inline-block text-xs text-muted-foreground">
            {row.original.ownerEmail}
          </span>
        </div>
      ),
    }),

    helper.accessor("guardianName", {
      id: "guardian",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colGuardian} />
      ),
      cell: ({ row }) => row.original.guardianName,
    }),

    helper.accessor("relation", {
      id: "relation",
      enableSorting: false,
      header: () => labels.colRelation,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.relation}</span>
      ),
    }),

    helper.accessor("state", {
      id: "state",
      enableSorting: false,
      // Filtered by its own facet, and the raw value ("live") is not what the
      // badge says in Arabic — searching it would match on a word nobody sees.
      enableGlobalFilter: false,
      header: () => labels.colState,
      cell: ({ row }) => (
        <Badge
          variant={guardianStateVariant(row.original.state)}
          className="whitespace-nowrap"
        >
          {guardianStateLabel(row.original.state, locale)}
        </Badge>
      ),
    }),

    // Only meaningful while an invitation is still outstanding — an accepted
    // guardian's expiry is a date that stopped mattering.
    helper.accessor("inviteExpiresAt", {
      id: "inviteExpiresAt",
      // A timestamp is epoch milliseconds to the filter, so typing "17" would
      // match every row in the table.
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colExpires} />
      ),
      cell: ({ row }) => {
        const { state, inviteExpiresAt } = row.original
        if (state === "live" || state === "accepted" || state === "revoked") {
          return <span className="text-muted-foreground">—</span>
        }
        const date = fmtDate(inviteExpiresAt, locale)
        return (
          <span
            className={
              state === "expired"
                ? "text-destructive whitespace-nowrap tabular-nums"
                : "whitespace-nowrap tabular-nums"
            }
          >
            {state === "expired"
              ? labels.expiredOn.replace("{date}", date)
              : date}
          </span>
        )
      },
    }),

    helper.accessor("invitedAt", {
      id: "invitedAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colInvited} />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {fmtDate(row.original.invitedAt, locale)}
        </span>
      ),
    }),

    helper.display({
      id: "actions",
      enableHiding: false,
      header: () => <span className="sr-only">{labels.colActions}</span>,
      // Read-only, deliberately. Revoking a guardian is the owner's decision,
      // made on their own device, and staff have no standing to make it for
      // them — so the only thing here is a way to reach the owner.
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs">
              <span className="sr-only">{labels.openMenu}</span>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={row.original.ownerEmail === null}
                onClick={() =>
                  void navigator.clipboard.writeText(
                    row.original.ownerEmail ?? ""
                  )
                }
              >
                {labels.actionCopyOwnerEmail}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ])
}

/** Column id → label, for the visibility menu. */
export function guardianColumnLabels(locale: Locale): Record<string, string> {
  const labels = t(GUARDIANS, locale)
  return {
    owner: labels.colOwner,
    guardian: labels.colGuardian,
    relation: labels.colRelation,
    state: labels.colState,
    inviteExpiresAt: labels.colExpires,
    invitedAt: labels.colInvited,
    actions: labels.colActions,
  }
}
