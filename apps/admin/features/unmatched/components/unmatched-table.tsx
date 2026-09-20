"use client"

import { useMemo } from "react"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import type { FunctionReturnType } from "convex/server"
import { usePaginatedQuery } from "convex/react"
import { SearchXIcon } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { useLocale } from "@/components/locale-provider"
import { LinkSubject } from "@/features/unmatched/components/link-subject"
import { UNMATCHED } from "@/features/unmatched/strings/unmatched"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"

type Row = FunctionReturnType<typeof api.admin.unmatchedClaims>["page"][number]

/**
 * How many to hold at once.
 *
 * This queue is fed by typos, so it is short by nature and long only when
 * something is wrong. A hundred is more than an operator works in a sitting
 * and enough that a genuine flood is visible rather than paged past.
 */
const LOADED = 100

const helper = createColumnHelper<DataTableFeatures, Row>()

function unmatchedColumns(locale: Locale): ColumnDef<DataTableFeatures, Row>[] {
  const labels = t(UNMATCHED, locale)

  return helper.columns([
    // First column, because it is the whole point of the screen: a human
    // reading the typed address next to a real one is what spots the typo.
    helper.accessor((row) => row.subjectEmail ?? "", {
      id: "typed",
      enableSorting: false,
      header: () => labels.colTyped,
      cell: ({ row }) =>
        row.original.subjectEmail === null ? (
          <span className="text-muted-foreground">{labels.none}</span>
        ) : (
          <span dir="ltr" className="inline-block font-medium">
            {row.original.subjectEmail}
          </span>
        ),
    }),

    helper.accessor("claimantName", {
      id: "claimant",
      enableSorting: false,
      header: () => labels.colClaimant,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.claimantName}</span>
          <span
            dir="ltr"
            className="inline-block text-xs text-muted-foreground"
          >
            {row.original.claimantContact}
          </span>
        </div>
      ),
    }),

    helper.accessor((row) => row.certificateName ?? "", {
      id: "certificate",
      enableSorting: false,
      header: () => labels.colCertificate,
      cell: ({ row }) =>
        row.original.certificateName === null ? (
          <span className="text-muted-foreground">{labels.none}</span>
        ) : (
          <span>{row.original.certificateName}</span>
        ),
    }),

    helper.accessor("submittedAt", {
      id: "submittedAt",
      enableSorting: false,
      header: () => labels.colSubmitted,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground tabular-nums">
          {fmtDate(row.original.submittedAt, locale)}
        </span>
      ),
    }),

    helper.display({
      id: "actions",
      enableHiding: false,
      header: () => <span className="sr-only">{labels.colActions}</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end">
          <LinkSubject
            claimId={row.original.id}
            typed={row.original.subjectEmail ?? ""}
            locale={locale}
          />
        </div>
      ),
    }),
  ])
}

/**
 * The typo queue.
 *
 * `admin.unmatchedClaims` and `claims.adminLinkSubject` both existed with no
 * screen between them, which made the repair unreachable: a report filed
 * against a mistyped address sat invisible until the daily sweep closed it, and
 * the person who filed it waited on something nobody could see.
 *
 * Oldest first, as the query returns them — this is a queue with a deadline
 * attached, and the row closest to being closed automatically is the one worth
 * a human's time.
 */
export function UnmatchedTable() {
  const locale = useLocale()
  const labels = useMemo(() => t(UNMATCHED, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])

  const { results, status } = usePaginatedQuery(
    api.admin.unmatchedClaims,
    {},
    { initialNumItems: LOADED }
  )

  const columns = useMemo(() => unmatchedColumns(locale), [locale])
  const columnLabels = useMemo(
    () => ({
      typed: labels.colTyped,
      claimant: labels.colClaimant,
      certificate: labels.colCertificate,
      submittedAt: labels.colSubmitted,
    }),
    [labels]
  )

  if (status === "LoadingFirstPage") {
    return <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
  }

  return (
    <DataTable<Row>
      columns={columns}
      data={results}
      fill
      searchPlaceholder={labels.searchPlaceholder}
      labels={tableLabels}
      locale={locale}
      columnLabels={columnLabels}
      getRowId={(row) => row.id}
      capped={status === "CanLoadMore" ? { cap: results.length } : undefined}
      empty={
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <SearchXIcon className="size-6 text-muted-foreground" />
          <span className="font-medium">{labels.empty}</span>
          <span className="max-w-sm text-sm text-muted-foreground">
            {labels.emptyHint}
          </span>
        </div>
      }
    />
  )
}
