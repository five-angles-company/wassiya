"use client"

import type { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import type { FunctionReturnType } from "convex/server"

import { PersonCell } from "@/components/person-cell"
import { ScalarMeta } from "@/components/scalar-meta"
import { NOTIFICATIONS } from "@/features/notifications/strings/notifications"
import { domainLabel, domainOf } from "@/lib/audit-domains"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

export type NotificationRow = FunctionReturnType<
  typeof api.admin.notificationsPage
>["page"][number]

const helper = createColumnHelper<DataTableFeatures, NotificationRow>()

export function notificationColumns(
  locale: Locale
): ColumnDef<DataTableFeatures, NotificationRow>[] {
  const labels = t(NOTIFICATIONS, locale)

  return helper.columns([
    helper.accessor("kind", {
      id: "kind",
      enableSorting: false,
      header: () => labels.colKind,
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-1">
          {/* Raw, like the audit event beside it on the sibling screen: the
              kind is what the writer wrote, and the mobile app switches on
              this exact string to decide how the notice renders. */}
          <span dir="ltr" className="inline-block font-mono text-xs font-medium">
            {row.original.kind}
          </span>
          <Badge variant="outline" className="font-normal">
            {domainLabel(domainOf(row.original.kind), locale)}
          </Badge>
        </div>
      ),
    }),

    helper.accessor("recipientName", {
      id: "recipient",
      enableSorting: false,
      header: () => labels.colRecipient,
      cell: ({ row }) => (
        <PersonCell
          id={row.original.recipientId}
          name={row.original.recipientName}
          email={row.original.recipientEmail}
        />
      ),
    }),

    helper.display({
      id: "payload",
      header: () => labels.colPayload,
      cell: ({ row }) => <ScalarMeta data={row.original.payload} />,
    }),

    // Unread is the state worth seeing, so it is the one that carries weight:
    // an owner who was told about a missed check-in and has not opened it is
    // the case the escalation ladder is about to act on.
    helper.accessor("readAt", {
      id: "read",
      enableSorting: false,
      header: () => labels.colRead,
      cell: ({ row }) =>
        row.original.readAt === null ? (
          <Badge variant="secondary" className="whitespace-nowrap">
            {labels.unread}
          </Badge>
        ) : (
          <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
            {labels.read} · {fmtDate(row.original.readAt, locale)}
          </span>
        ),
    }),

    helper.accessor("at", {
      id: "at",
      enableSorting: false,
      header: () => labels.colAt,
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums text-muted-foreground">
          {fmtDate(row.original.at, locale)}
        </span>
      ),
    }),
  ])
}
