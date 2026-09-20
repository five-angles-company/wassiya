"use client"

import { useMemo } from "react"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"
import { BellIcon } from "lucide-react"
import { parseAsArrayOf, parseAsStringLiteral, useQueryStates } from "nuqs"

import { DataTable } from "@/components/data-table"
import { useLocale } from "@/components/locale-provider"
import { MultiFacet } from "@/components/multi-facet"
import {
  notificationColumns,
  type NotificationRow,
} from "@/features/notifications/components/notification-columns"
import { NOTIFICATIONS } from "@/features/notifications/strings/notifications"
import { NOTIFICATION_DOMAINS, domainLabel } from "@/lib/audit-domains"
import { t } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"
import { useLastLoaded } from "@/lib/use-last-loaded"
import { useTableUrlState } from "@/lib/use-table-url-state"

const READ_STATES = ["unread", "read"] as const

/** Both selected, or neither, is the same question: no constraint. */
function unreadArg(states: readonly string[]): boolean | undefined {
  if (states.length !== 1) return undefined
  return states[0] === "unread"
}

/** No column sorts — an append-only log has one meaningful order. */
const NO_SORTING = [] as const

/**
 * ٣.٣ from the console's side — what an owner was told inside the app.
 *
 * The pair to the email log, and the reason both screens exist rather than one:
 * an owner who misses a check-in gets an in-app row *and* a message, written by
 * different code down different channels. "Did this person hear from us at
 * all?" is only answerable with both — and on a deployment where `RESEND_FROM`
 * is unset, the two disagree completely, which is exactly the case worth being
 * able to see.
 *
 * Three domains in the facet, not twelve. Only the escalation ladder, the claim
 * machine and a recovery attempt insert here; the audit log's other nine
 * domains never produce a notification, and offering them would be nine filters
 * that always come back empty.
 *
 * `notifications` carries only `by_userId` indexes, so the server reads in
 * creation order and filters. Affordable because notifications are bounded by
 * owners and events rather than by traffic — the whole table is six rows today
 * — and pagination bounds it either way.
 */
export function NotificationsLog() {
  const locale = useLocale()
  const labels = useMemo(() => t(NOTIFICATIONS, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])

  const [facets, setFacets] = useQueryStates(
    {
      domain: parseAsArrayOf(
        parseAsStringLiteral(NOTIFICATION_DOMAINS)
      ).withDefault([]),
      state: parseAsArrayOf(parseAsStringLiteral(READ_STATES)).withDefault([]),
    },
    { history: "replace", clearOnDefault: true }
  )

  const url = useTableUrlState({
    defaultSorting: [],
    sortableIds: NO_SORTING,
    facetKey: `${facets.domain.join(",")}|${facets.state.join(",")}`,
  })

  const filters = useMemo(
    () => ({
      domains: facets.domain,
      search: url.search,
      unread: unreadArg(facets.state),
    }),
    [facets.domain, facets.state, url.search]
  )

  const { data: page, loading } = useLastLoaded(
    useQuery(api.admin.notificationsPage, {
      ...filters,
      paginationOpts: { numItems: url.pageSize, cursor: url.cursor },
    })
  )
  const { data: tally } = useLastLoaded(
    useQuery(api.admin.notificationsTally, filters)
  )

  const columns = useMemo(() => notificationColumns(locale), [locale])
  const columnLabels = useMemo(
    () => ({
      kind: labels.colKind,
      recipient: labels.colRecipient,
      payload: labels.colPayload,
      read: labels.colRead,
      at: labels.colAt,
    }),
    [labels]
  )
  const domainOptions = useMemo(
    () =>
      NOTIFICATION_DOMAINS.map((value) => ({
        value,
        label: domainLabel(value, locale),
      })),
    [locale]
  )
  const stateOptions = useMemo(
    () => [
      { value: "unread", label: labels.unread },
      { value: "read", label: labels.read },
    ],
    [labels]
  )

  if (page === undefined) {
    return <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <p className="max-w-3xl text-sm text-muted-foreground">{labels.intro}</p>

      <DataTable<NotificationRow>
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
          <>
            <MultiFacet
              title={labels.filterDomain}
              options={domainOptions}
              values={facets.domain}
              onChange={(update) =>
                void setFacets((current) => ({
                  domain: update(current.domain),
                }))
              }
              clearLabel={tableLabels.resetFilters}
            />
            <MultiFacet
              title={labels.filterRead}
              options={stateOptions}
              values={facets.state}
              onChange={(update) =>
                void setFacets((current) => ({ state: update(current.state) }))
              }
              clearLabel={tableLabels.resetFilters}
            />
          </>
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
            <BellIcon className="size-6 text-muted-foreground" />
            <p className="font-medium">{labels.empty}</p>
            <p className="text-sm text-muted-foreground">{labels.emptyHint}</p>
          </div>
        }
      />
    </div>
  )
}
