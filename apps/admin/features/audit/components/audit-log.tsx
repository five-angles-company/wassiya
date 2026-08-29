"use client"

import { useMemo } from "react"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"
import { FileClockIcon } from "lucide-react"
import { parseAsArrayOf, parseAsStringLiteral, useQueryState } from "nuqs"

import { DataTable } from "@/components/data-table"
import { useLocale } from "@/components/locale-provider"
import { MultiFacet } from "@/components/multi-facet"
import {
  auditColumns,
  type AuditRow,
} from "@/features/audit/components/audit-columns"
import { AUDIT } from "@/features/audit/strings/audit"
import { AUDIT_DOMAINS, domainLabel } from "@/lib/audit-domains"
import { t } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"
import { useLastLoaded } from "@/lib/use-last-loaded"
import { useTableUrlState } from "@/lib/use-table-url-state"

/**
 * Validated against the twelve domains the server accepts.
 *
 * Load-bearing rather than tidy: `auditFilterArgs.domains` is a literal union,
 * so `?domains=notadomain` reaching Convex would throw a validator error and
 * blank the screen. `parseAsArrayOf` drops the unknown member instead, which
 * is the only sane reading of a hand-edited or stale link.
 */
const domainsParser = parseAsArrayOf(
  parseAsStringLiteral(AUDIT_DOMAINS)
).withDefault([])

/** No column sorts, so nothing is sortable and the default is empty. */
const NO_SORTING = [] as const

/**
 * ٩.٣ from the console's side — the append-only record.
 *
 * The compliance backbone of a product that hands over estates: who did what,
 * to whom, and when. Until `auditLog.by_at` existed it could only be read one
 * account at a time, so *"what happened recently"* had no answer at all.
 *
 * Read-only in the strongest sense available here. `verify-invariants.mjs`
 * fails the build on any `patch`, `replace` or `delete` against this table, so
 * there is no mutation for this screen to call even if someone wanted one — and
 * the screen says so above the table rather than leaving it to be assumed.
 *
 * Faceted by **domain**, not by event: thirty-five event names live on the
 * deployment today and the code can write more, so a dropdown of every one is
 * a filter nobody uses. The server resolves a domain to a prefix range, which
 * means a new `claim.*` event is filterable the day it is written with nothing
 * to keep in sync.
 *
 * Newest first, and no column sorts. A log with one meaningful order should not
 * offer a sort that silently reorders only the page in front of you.
 */
export function AuditLog() {
  const locale = useLocale()
  const labels = useMemo(() => t(AUDIT, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])

  const [domains, setDomains] = useQueryState("domains", domainsParser)
  const url = useTableUrlState({
    defaultSorting: [],
    sortableIds: NO_SORTING,
    facetKey: domains.join(","),
  })

  const filters = useMemo(
    () => ({ domains, search: url.search }),
    [domains, url.search]
  )

  const { data: page, loading } = useLastLoaded(
    useQuery(api.admin.auditPage, {
      ...filters,
      paginationOpts: { numItems: url.pageSize, cursor: url.cursor },
    })
  )
  const { data: tally } = useLastLoaded(useQuery(api.admin.auditTally, filters))

  const columns = useMemo(() => auditColumns(locale), [locale])
  const columnLabels = useMemo(
    () => ({
      event: labels.colEvent,
      subject: labels.colSubject,
      meta: labels.colMeta,
      at: labels.colAt,
    }),
    [labels]
  )
  const options = useMemo(
    () =>
      AUDIT_DOMAINS.map((value) => ({
        value,
        label: domainLabel(value, locale),
      })),
    [locale]
  )

  if (page === undefined) {
    return <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <p className="max-w-3xl text-sm text-muted-foreground">{labels.intro}</p>

      <DataTable<AuditRow>
        columns={columns}
        data={page.page}
        busy={loading}
        fill
        labels={tableLabels}
        locale={locale}
        columnLabels={columnLabels}
        getRowId={(row) => row.id}
        searchPlaceholder={labels.searchPlaceholder}
        filters={
          <MultiFacet
            title={labels.filterDomain}
            options={options}
            values={domains}
            onChange={setDomains}
            clearLabel={tableLabels.resetFilters}
          />
        }
        server={{
          search: url.searchInput,
          onSearchChange: url.setSearch,
          sorting: [],
          onSortingChange: () => undefined,
          sortLocked: false,
          page: url.pageNumber,
          pageSize: url.pageSize,
          onPageSizeChange: url.setPageSize,
          canPrev: url.canPrev,
          canNext: !page.isDone,
          onPrev: url.prevPage,
          onNext: () => url.nextPage(page.continueCursor),
          total: tally,
          loading,
        }}
        empty={
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <FileClockIcon className="size-6 text-muted-foreground" />
            <p className="font-medium">{labels.empty}</p>
            <p className="text-sm text-muted-foreground">{labels.emptyHint}</p>
          </div>
        }
      />
    </div>
  )
}
