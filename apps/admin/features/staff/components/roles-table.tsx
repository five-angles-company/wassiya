"use client"

import { useMemo, useState } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import type { FunctionReturnType } from "convex/server"
import { useQuery } from "convex/react"
import { LockIcon, PlusIcon, ShieldCheckIcon } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { useLocale } from "@/components/locale-provider"
import { RoleSheet } from "@/features/staff/components/role-sheet"
import { STAFF } from "@/features/staff/strings/staff"
import { usePermissions } from "@/hooks/use-permissions"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"

type Role = FunctionReturnType<typeof api.staff.roles>[number]

const helper = createColumnHelper<DataTableFeatures, Role>()

/**
 * What a role is worth, and how many people carry it.
 *
 * Its own screen rather than a panel under the team list, because the two are
 * worked at different moments: the list answers "who is in", this answers
 * "what does that let them do". Stacked on one page, the roles sat below a
 * staff list that grows, so the answer to the second question moved further
 * down the page every time somebody joined.
 *
 * The holder count is on the row because it is what makes an edit
 * consequential: saving a role changes everyone holding it, in every tab they
 * have open, within the round trip.
 */
export function RolesTable() {
  const locale = useLocale()
  const labels = useMemo(() => t(STAFF, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])
  const { has } = usePermissions()

  const roles = useQuery(api.staff.roles)
  const canManage = has("staff.manage")

  // `null` id is the create sheet; a set id is the edit sheet. Closed is
  // `undefined`, so "creating" and "closed" stay distinguishable.
  const [editing, setEditing] = useState<Id<"staffRoles"> | null | undefined>(
    undefined
  )

  const columns = useMemo(
    () => roleColumns(locale, canManage, (id) => setEditing(id)),
    [locale, canManage]
  )
  const columnLabels = useMemo(
    () => ({
      role: labels.colRole,
      scope: labels.colScope,
      holders: labels.colHolders,
    }),
    [labels]
  )

  if (roles === undefined) {
    return <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
  }

  const selected =
    editing === undefined || editing === null
      ? null
      : (roles.find((role) => role.id === editing) ?? null)

  return (
    <>
      <DataTable<Role>
        columns={columns}
        data={roles}
        fill
        labels={tableLabels}
        locale={locale}
        columnLabels={columnLabels}
        getRowId={(row) => row.id}
        searchable
        searchPlaceholder={labels.searchRoles}
        // The Owner role opens nothing: it is immutable, and a sheet that can
        // only be closed again is a worse answer than a row that does not move.
        onRowClick={
          canManage
            ? (row) => {
                if (!row.system) setEditing(row.id)
              }
            : undefined
        }
        filters={
          canManage ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(null)}
            >
              <PlusIcon className="size-3.5" aria-hidden />
              {labels.newRole}
            </Button>
          ) : undefined
        }
        empty={
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <ShieldCheckIcon className="size-6 text-muted-foreground" />
            <span className="font-medium">{labels.rolesEmpty}</span>
            <span className="max-w-sm text-sm text-muted-foreground">
              {labels.rolesEmptyHint}
            </span>
          </div>
        }
      />

      {/* Keyed so each opening starts from that role's own values: the sheet
          seeds its fields from props, and a shared instance would keep the
          previous role's text. */}
      <RoleSheet
        key={selected?.id ?? "new"}
        role={
          selected === null
            ? null
            : {
                id: selected.id,
                name: selected.name,
                description: selected.description,
                permissions: selected.permissions,
                holders: selected.holders,
              }
        }
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
      />
    </>
  )
}

function roleColumns(
  locale: Locale,
  canManage: boolean,
  onEdit: (id: Id<"staffRoles">) => void
): ColumnDef<DataTableFeatures, Role>[] {
  const labels = t(STAFF, locale)

  return helper.columns([
    helper.accessor((row) => `${row.name.ar} ${row.name.en}`, {
      id: "role",
      enableSorting: false,
      header: () => labels.colRole,
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium">
              {row.original.name[locale]}
            </span>
            {row.original.system && (
              <Badge variant="secondary" className="gap-1">
                <LockIcon className="size-3" aria-hidden />
                {labels.roleSystem}
              </Badge>
            )}
          </span>
          <span className="max-w-lg truncate text-xs text-muted-foreground">
            {row.original.system
              ? labels.roleSystemHint
              : (row.original.description?.[locale] ?? "")}
          </span>
        </div>
      ),
    }),

    helper.display({
      id: "scope",
      header: () => labels.colScope,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {row.original.system
            ? labels.roleAll
            : labels.rolePermissions.replace(
                "{count}",
                fmtNumber(row.original.permissions.length, locale)
              )}
        </span>
      ),
    }),

    helper.accessor((row) => row.holders, {
      id: "holders",
      enableSorting: false,
      header: () => labels.colHolders,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground tabular-nums">
          {row.original.holders === 0
            ? labels.roleHoldersNone
            : row.original.holders === 1
              ? labels.roleHoldersOne
              : labels.roleHolders.replace(
                  "{count}",
                  fmtNumber(row.original.holders, locale)
                )}
        </span>
      ),
    }),

    helper.display({
      id: "actions",
      enableHiding: false,
      header: () => <span className="sr-only">{labels.colActions}</span>,
      cell: ({ row }) =>
        !canManage || row.original.system ? null : (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(row.original.id)}
            >
              {labels.roleEditTitle}
            </Button>
          </div>
        ),
    }),
  ])
}
