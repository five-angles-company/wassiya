"use client"

import type { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import type { FunctionReturnType } from "convex/server"

import { PersonCell } from "@/components/person-cell"
import { ScalarMeta } from "@/components/scalar-meta"
import { AUDIT } from "@/features/audit/strings/audit"
import { domainLabel, domainOf } from "@/lib/audit-domains"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

export type AuditRow = FunctionReturnType<
  typeof api.admin.auditPage
>["page"][number]

const helper = createColumnHelper<DataTableFeatures, AuditRow>()

export function auditColumns(
  locale: Locale
): ColumnDef<DataTableFeatures, AuditRow>[] {
  const labels = t(AUDIT, locale)

  return helper.columns([
    helper.accessor("event", {
      id: "event",
      enableSorting: false,
      header: () => labels.colEvent,
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-1">
          {/* Raw and untranslated: an operator holding this next to the
              deployment's function log must read the same string twice. */}
          <span
            dir="ltr"
            className="inline-block font-mono text-xs font-medium"
          >
            {row.original.event}
          </span>
          <Badge variant="outline" className="font-normal">
            {domainLabel(domainOf(row.original.event), locale)}
          </Badge>
        </div>
      ),
    }),

    helper.accessor("subjectName", {
      id: "subject",
      enableSorting: false,
      header: () => labels.colSubject,
      cell: ({ row }) => (
        <PersonCell
          id={row.original.subjectId}
          name={row.original.subjectName}
          email={row.original.subjectEmail}
        />
      ),
    }),

    helper.accessor("actorName", {
      id: "actor",
      enableSorting: false,
      header: () => labels.colActor,
      // Empty for everything an owner or a cron did to itself, which is most of
      // the log. A dash rather than a blank, so "nobody did this to them" and
      // "the column failed to load" do not read the same.
      cell: ({ row }) =>
        row.original.actorId === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <PersonCell
            id={row.original.actorId}
            name={row.original.actorName}
            email={null}
          />
        ),
    }),

    helper.display({
      id: "meta",
      header: () => labels.colMeta,
      cell: ({ row }) => <ScalarMeta data={row.original.meta} />,
    }),

    helper.accessor("at", {
      id: "at",
      enableSorting: false,
      header: () => labels.colAt,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground tabular-nums">
          {fmtDate(row.original.at, locale)}
        </span>
      ),
    }),
  ])
}
