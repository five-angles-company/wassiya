"use client"

import { useMemo } from "react"
import Link from "next/link"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery } from "convex/react"
import { FileClockIcon, UserCogIcon } from "lucide-react"
import { toast } from "sonner"

import { ConfirmAction } from "@/components/confirm-action"
import { DataTable } from "@/components/data-table"
import { useLocale } from "@/components/locale-provider"
import { AssignRoles } from "@/features/staff/components/assign-roles"
import { CopyInviteLink } from "@/features/staff/components/copy-invite-link"
import { InviteStaff } from "@/features/staff/components/invite-staff"
import { STAFF } from "@/features/staff/strings/staff"
import { usePermissions } from "@/hooks/use-permissions"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"

/**
 * One row per person who has access, **or is about to**.
 *
 * A staff account and an unaccepted invitation are the same question — "who
 * can get into this console?" — and splitting them across two panels meant the
 * answer was never in one place. An invitation is a row whose access has not
 * started yet, so it sits in the same table, carries the same roles, and is
 * told apart by its status rather than by which card it is in.
 */
type Row = {
  id: string
  kind: "member" | "invitation"
  name: string
  email: string | null
  roles: { id: Id<"staffRoles">; label: string }[]
  roleIds: Id<"staffRoles">[]
  status: Status
  at: number
  isSelf: boolean
  userId: Id<"users"> | null
  invitationId: Id<"staffInvitations"> | null
  /** Invitations only: what a copied invitation has to state as its deadline. */
  expiresAt: number | null
}

/**
 * The five states a row can be in.
 *
 * A vocabulary rather than a chain of conditions, because it is also the facet:
 * a filter offering a value no row can hold — or missing one that rows do — is
 * a filter that lies about the table.
 */
export const STAFF_STATUSES = [
  "owner",
  "active",
  "noRoles",
  "invited",
  "expired",
] as const
export type Status = (typeof STAFF_STATUSES)[number]

export function statusLabel(status: Status, locale: Locale): string {
  const labels = t(STAFF, locale)
  if (status === "owner") return labels.statusOwner
  if (status === "active") return labels.statusActive
  if (status === "noRoles") return labels.statusNoRoles
  if (status === "invited") return labels.statusInvited
  return labels.statusExpired
}

const helper = createColumnHelper<DataTableFeatures, Row>()

export function StaffTable() {
  const locale = useLocale()
  const labels = useMemo(() => t(STAFF, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])
  const { has } = usePermissions()

  const me = useQuery(api.staff.me)
  const staff = useQuery(api.staff.list)
  const invitations = useQuery(api.staff.invitations)
  const remove = useMutation(api.staff.removeStaff)
  const revoke = useMutation(api.staff.revokeInvitation)
  const canManage = has("staff.manage")

  const rows = useMemo<Row[]>(() => {
    const members: Row[] = (staff ?? []).map((person) => ({
      id: person.id,
      kind: "member" as const,
      name: person.name ?? person.email ?? "",
      email: person.email,
      roles: person.roles.map((role) => ({
        id: role.id,
        label: role.name[locale],
      })),
      roleIds: person.roles.map((role) => role.id),
      status: person.isOwner
        ? ("owner" as const)
        : person.needsRoles
          ? ("noRoles" as const)
          : ("active" as const),
      at: person.staffSince ?? person.joinedAt,
      isSelf: person.id === me?.userId,
      userId: person.id,
      invitationId: null,
      expiresAt: null,
    }))

    const pending: Row[] = (invitations ?? []).map((row) => ({
      id: row.id,
      kind: "invitation" as const,
      name: row.email,
      email: row.email,
      roles: row.roles.map((role) => ({
        id: role.id,
        label: role.name[locale],
      })),
      roleIds: row.roles.map((role) => role.id),
      status: row.expired ? ("expired" as const) : ("invited" as const),
      at: row.invitedAt,
      isSelf: false,
      userId: null,
      invitationId: row.id,
      expiresAt: row.expiresAt,
    }))

    // Newest first across both kinds: a fresh invitation is the row an operator
    // came to this screen to look at.
    return [...members, ...pending].sort((a, b) => b.at - a.at)
  }, [staff, invitations, me?.userId, locale])

  const columns = useMemo(
    () =>
      staffColumns({
        locale,
        canManage,
        canAudit: has("audit.read"),
        onRemove: async (userId) => {
          try {
            await remove({ userId })
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : t(STAFF, locale).failed
            )
          }
        },
        onRevoke: async (invitationId) => {
          try {
            await revoke({ invitationId })
            toast.success(t(STAFF, locale).revoked)
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : t(STAFF, locale).failed
            )
          }
        },
      }),
    [locale, canManage, has, remove, revoke]
  )

  const columnLabels = useMemo(
    () => ({
      person: labels.colPerson,
      roles: labels.colRoles,
      status: labels.colStatus,
      at: labels.colSince,
    }),
    [labels]
  )

  if (staff === undefined) {
    return <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
  }

  return (
    <DataTable<Row>
      columns={columns}
      data={rows}
      fill
      labels={tableLabels}
      locale={locale}
      columnLabels={columnLabels}
      getRowId={(row) => row.id}
      searchable
      searchPlaceholder={labels.searchPlaceholder}
      filters={canManage ? <InviteStaff /> : undefined}
      facets={[
        {
          columnId: "status",
          title: labels.colStatus,
          options: STAFF_STATUSES.map((value) => ({
            value,
            label: statusLabel(value, locale),
          })),
        },
      ]}
      empty={
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <UserCogIcon className="size-6 text-muted-foreground" />
          <span className="font-medium">{labels.staffEmpty}</span>
          <span className="max-w-sm text-sm text-muted-foreground">
            {labels.staffEmptyHint}
          </span>
        </div>
      }
    />
  )
}

function staffColumns({
  locale,
  canManage,
  canAudit,
  onRemove,
  onRevoke,
}: {
  locale: Locale
  canManage: boolean
  canAudit: boolean
  onRemove: (userId: Id<"users">) => Promise<void>
  onRevoke: (invitationId: Id<"staffInvitations">) => Promise<void>
}): ColumnDef<DataTableFeatures, Row>[] {
  const labels = t(STAFF, locale)

  return helper.columns([
    helper.accessor((row) => `${row.name} ${row.email ?? ""}`, {
      id: "person",
      enableSorting: false,
      header: () => labels.colPerson,
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium">{row.original.name}</span>
            {row.original.isSelf && (
              <Badge variant="outline">{labels.self}</Badge>
            )}
          </span>
          {/* An address is a machine string: LTR inside Arabic prose, or bidi
              reordering mangles it. */}
          <span
            dir="ltr"
            className="inline-block truncate text-xs text-muted-foreground"
          >
            {row.original.email}
          </span>
        </div>
      ),
    }),

    helper.display({
      id: "roles",
      header: () => labels.colRoles,
      cell: ({ row }) =>
        row.original.roles.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            {labels.noRoles}
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {row.original.roles.map((role) => (
              <Badge key={role.id} variant="outline">
                {role.label}
              </Badge>
            ))}
          </div>
        ),
    }),

    // An accessor, not a display column: a facet filters on the column's value,
    // so the value has to be the status itself and the cell draws the badge.
    helper.accessor((row) => row.status, {
      id: "status",
      enableSorting: false,
      filterFn: "arrIncludesSome",
      header: () => labels.colStatus,
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge
            variant={
              status === "owner"
                ? "secondary"
                : status === "active"
                  ? "outline"
                  : status === "invited"
                    ? "outline"
                    : "destructive"
            }
            className={status === "invited" ? "border-dashed" : undefined}
          >
            {statusLabel(status, locale)}
          </Badge>
        )
      },
    }),

    helper.accessor((row) => row.at, {
      id: "at",
      enableSorting: false,
      header: () => labels.colSince,
      cell: ({ row }) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
          {row.original.kind === "member"
            ? labels.since.replace("{date}", fmtDate(row.original.at, locale))
            : labels.invitedAt.replace(
                "{date}",
                fmtDate(row.original.at, locale)
              )}
        </span>
      ),
    }),

    helper.display({
      id: "actions",
      enableHiding: false,
      header: () => <span className="sr-only">{labels.colActions}</span>,
      cell: ({ row }) => {
        const person = row.original

        return (
          <div className="flex items-center justify-end gap-1">
            {canAudit && person.userId !== null && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/audit?actor=${person.userId}`}>
                  <FileClockIcon className="size-3.5" aria-hidden />
                  <span className="sr-only">{labels.seeActions}</span>
                </Link>
              </Button>
            )}

            {!canManage ? null : person.kind === "invitation" ? (
              <>
                {/* Not offered once it has lapsed: signing in would bind
                    nothing, and a copied message naming a date in the past is
                    worse than no button. Inviting the same address again
                    refreshes this very row. */}
                {person.status !== "expired" && person.expiresAt !== null && (
                  <CopyInviteLink
                    email={person.email ?? ""}
                    expiresAt={person.expiresAt}
                  />
                )}
                <ConfirmAction
                  tone="destructive"
                  title={labels.revokeTitle}
                  body={labels.revokeBody}
                  confirmLabel={labels.revoke}
                  cancelLabel={labels.cancel}
                  trigger={
                    <Button variant="ghost" size="sm">
                      {labels.revoke}
                    </Button>
                  }
                  onConfirm={() => onRevoke(person.invitationId!)}
                />
              </>
            ) : person.isSelf ? (
              // Stated rather than offered: the mutation refuses a self-edit,
              // and a button that always throws is worse than a sentence.
              <span className="max-w-56 px-2 text-end text-xs text-muted-foreground">
                {labels.selfHint}
              </span>
            ) : (
              <>
                <AssignRoles
                  userId={person.userId!}
                  name={person.name}
                  current={person.roleIds}
                  trigger={
                    <Button variant="outline" size="sm">
                      {labels.editRoles}
                    </Button>
                  }
                />
                <ConfirmAction
                  tone="destructive"
                  title={labels.removeTitle}
                  body={labels.removeBody}
                  confirmLabel={labels.remove}
                  cancelLabel={labels.cancel}
                  trigger={
                    <Button variant="ghost" size="sm">
                      {labels.remove}
                    </Button>
                  }
                  onConfirm={() => onRemove(person.userId!)}
                />
              </>
            )}
          </div>
        )
      },
    }),
  ])
}
