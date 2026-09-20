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
import { IdentityBadge } from "@/components/identity-badge"
import { IDENTITY } from "@/features/identity/strings/identity"
import { ResetAttempts } from "@/features/identity/components/reset-attempts"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

export type IdentityRow = FunctionReturnType<
  typeof api.admin.identityPage
>["page"][number]

const helper = createColumnHelper<DataTableFeatures, IdentityRow>()

export function identityColumns(
  locale: Locale
): ColumnDef<DataTableFeatures, IdentityRow>[] {
  const labels = t(IDENTITY, locale)

  return helper.columns([
    helper.accessor("email", {
      id: "owner",
      enableSorting: false,
      header: () => labels.colOwner,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.original.name ?? (
              <span className="text-muted-foreground">{labels.nameNone}</span>
            )}
          </span>
          {/* An address stays LTR inside Arabic prose. */}
          <span
            dir="ltr"
            className="inline-block text-xs text-muted-foreground"
          >
            {row.original.email}
          </span>
        </div>
      ),
    }),

    helper.accessor("status", {
      id: "status",
      enableSorting: false,
      header: () => labels.colStatus,
      cell: ({ row }) => (
        <IdentityBadge status={row.original.status} locale={locale} />
      ),
    }),

    // The number the whole screen exists for. `2 / 3` rather than `2`, because
    // an attempt count means nothing without the cap it is approaching.
    helper.accessor("attempts", {
      id: "attempts",
      enableSorting: false,
      header: () => labels.colAttempts,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="tabular-nums">
            {row.original.attempts} / {row.original.attemptsAllowed}
          </span>
          {row.original.stuck && (
            <Badge variant="destructive">{labels.stuckBadge}</Badge>
          )}
        </div>
      ),
    }),

    helper.accessor("verifiedName", {
      id: "verifiedName",
      enableSorting: false,
      header: () => labels.colVerifiedName,
      cell: ({ row }) =>
        row.original.verifiedName ?? (
          <span className="text-muted-foreground">{labels.none}</span>
        ),
    }),

    helper.accessor("docType", {
      id: "docType",
      enableSorting: false,
      header: () => labels.colDocType,
      cell: ({ row }) =>
        row.original.docType ?? (
          <span className="text-muted-foreground">{labels.none}</span>
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
        <div className="flex items-center justify-end gap-1">
          {/* Offered only where it would do something. `adminResetAttempts`
              refuses a verified account, and an account with attempts to spare
              is not blocked — a button that is always present would imply the
              screen's job is resetting people rather than unblocking them. */}
          {row.original.stuck && (
            <ResetAttempts
              userId={row.original.id}
              name={row.original.name ?? row.original.email ?? ""}
              locale={locale}
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs">
                <span className="sr-only">{labels.openMenu}</span>
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
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
        </div>
      ),
    }),
  ])
}

/** Column id → label, for the visibility menu. */
export function identityColumnLabels(locale: Locale): Record<string, string> {
  const labels = t(IDENTITY, locale)
  return {
    owner: labels.colOwner,
    status: labels.colStatus,
    attempts: labels.colAttempts,
    verifiedName: labels.colVerifiedName,
    docType: labels.colDocType,
    joinedAt: labels.colJoined,
    actions: labels.colActions,
  }
}
