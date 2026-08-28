"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import type { FunctionReturnType } from "convex/server"
import { useQuery } from "convex/react"
import { MailIcon } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { useLocale } from "@/components/locale-provider"
import { EMAIL_LOG } from "@/features/email/strings/email"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"
import { useLastLoaded } from "@/lib/use-last-loaded"

type EmailRow = FunctionReturnType<
  typeof api.admin.emailLogPage
>["page"][number]

const helper = createColumnHelper<DataTableFeatures, EmailRow>()

/**
 * The `what` strings `send()` passes, in the operator's language.
 *
 * Falls through to the raw value rather than "unknown": a kind this map has
 * not learned yet is a new message type someone added, and showing its literal
 * name is more useful than hiding it behind a placeholder.
 */
function kindLabel(kind: string, locale: Locale): string {
  const labels = t(EMAIL_LOG, locale)
  if (kind === "escalation") return labels.kindEscalation
  if (kind === "guardian claim notice") return labels.kindGuardianClaim
  if (kind === "recovery notice") return labels.kindRecovery
  return kind
}

function emailColumns(
  locale: Locale
): ColumnDef<DataTableFeatures, EmailRow>[] {
  const labels = t(EMAIL_LOG, locale)

  return helper.columns([
    helper.accessor("kind", {
      id: "kind",
      enableSorting: false,
      header: () => labels.colKind,
      cell: ({ row }) => (
        <Badge variant="outline" className="whitespace-nowrap">
          {kindLabel(row.original.kind, locale)}
        </Badge>
      ),
    }),

    helper.accessor("recipientName", {
      id: "recipient",
      enableSorting: false,
      header: () => labels.colRecipient,
      cell: ({ row }) => (
        <Link
          href={`/owners/${row.original.recipientId}`}
          className="flex flex-col hover:underline"
        >
          <span>{row.original.recipientName}</span>
          <span
            dir="ltr"
            className="inline-block text-xs text-muted-foreground"
          >
            {row.original.recipientEmail}
          </span>
        </Link>
      ),
    }),

    helper.accessor("at", {
      id: "at",
      enableSorting: false,
      header: () => labels.colSentAt,
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {fmtDate(row.original.at, locale)}
        </span>
      ),
    }),
  ])
}

/**
 * What the system sent, to whom, and when.
 *
 * Until `send()` started recording, every outbound message vanished — the
 * escalation ladder, the guardian notice, the recovery alert — so *"did this
 * owner actually get the day-14 warning?"* had no answer short of the Resend
 * dashboard.
 *
 * A slice of `auditLog` rather than a table of its own, read through the new
 * `by_at` index. It carries the kind and the recipient and **never a body**:
 * an escalation notice is a fact about someone's mortality, and this log is
 * append-only and staff-readable.
 *
 * Newest first and not sortable — an append-only log has one meaningful order,
 * and offering a column sort that only reordered the page would imply
 * otherwise.
 */
export function EmailLog() {
  const locale = useLocale()
  const labels = useMemo(() => t(EMAIL_LOG, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [pageSize, setPageSize] = useState(25)
  const [cursors, setCursors] = useState<(string | null)[]>([null])

  const cursor = cursors[cursors.length - 1] ?? null
  const resetPaging = useCallback(() => setCursors([null]), [])

  useEffect(() => {
    if (searchInput === search) return
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      resetPaging()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, search, resetPaging])

  const { data: page, loading } = useLastLoaded(
    useQuery(api.admin.emailLogPage, {
      search,
      paginationOpts: { numItems: pageSize, cursor },
    })
  )
  const { data: tally } = useLastLoaded(
    useQuery(api.admin.emailLogTally, { search })
  )

  const columns = useMemo(() => emailColumns(locale), [locale])
  const columnLabels = useMemo(
    () => ({
      kind: labels.colKind,
      recipient: labels.colRecipient,
      at: labels.colSentAt,
    }),
    [labels]
  )

  if (page === undefined) {
    return <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
  }

  // Stated above the table, not inside its empty state: it is true whether or
  // not the current filter matches anything, and it changes what an empty
  // table means from "nothing happened" to "nothing can".
  const mailerOff = tally?.mailerConfigured === false

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {mailerOff && (
        <div className="rounded-xl border border-destructive/40 p-4">
          <p className="text-sm font-medium">{labels.mailerOffTitle}</p>
          <p className="text-sm text-muted-foreground">
            {labels.mailerOffBody}
          </p>
        </div>
      )}
      <DataTable<EmailRow>
        columns={columns}
        data={page.page}
        busy={loading}
        fill
        labels={tableLabels}
        locale={locale}
        columnLabels={columnLabels}
        getRowId={(row) => row.id}
        searchPlaceholder={labels.searchPlaceholder}
        server={{
          search: searchInput,
          onSearchChange: setSearchInput,
          sorting: [],
          onSortingChange: () => undefined,
          sortLocked: false,
          page: cursors.length,
          pageSize,
          onPageSizeChange: (size) => {
            setPageSize(size)
            resetPaging()
          },
          canPrev: cursors.length > 1,
          canNext: !page.isDone,
          onPrev: () =>
            setCursors((current) =>
              current.length > 1 ? current.slice(0, -1) : current
            ),
          onNext: () =>
            setCursors((current) => [...current, page.continueCursor]),
          total: tally,
          loading,
        }}
        empty={
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <MailIcon className="size-6 text-muted-foreground" />
            <p className="font-medium">{labels.empty}</p>
            <p className="text-sm text-muted-foreground">{labels.emptyHint}</p>
          </div>
        }
      />
    </div>
  )
}
