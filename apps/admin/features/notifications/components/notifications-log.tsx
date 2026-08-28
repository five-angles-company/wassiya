"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"
import { BellIcon } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { useLocale } from "@/components/locale-provider"
import { MultiFacet } from "@/components/multi-facet"
import {
  notificationColumns,
  type NotificationRow,
} from "@/features/notifications/components/notification-columns"
import { NOTIFICATIONS } from "@/features/notifications/strings/notifications"
import {
  NOTIFICATION_DOMAINS,
  domainLabel,
  type NotificationDomain,
} from "@/lib/audit-domains"
import { t } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"
import { useLastLoaded } from "@/lib/use-last-loaded"

/** Both selected, or neither, is the same question: no constraint. */
function unreadArg(states: ReadonlySet<string>): boolean | undefined {
  if (states.size !== 1) return undefined
  return states.has("unread")
}

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

  const [domains, setDomains] = useState<NotificationDomain[]>([])
  const [states, setStates] = useState<string[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [pageSize, setPageSize] = useState(25)
  const [cursors, setCursors] = useState<(string | null)[]>([null])

  const cursor = cursors[cursors.length - 1] ?? null
  const resetPaging = useCallback(() => setCursors([null]), [])

  useEffect(() => {
    if (searchInput.trim() === search) return
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      resetPaging()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, search, resetPaging])

  const stateSet = useMemo(() => new Set<string>(states), [states])
  const filters = useMemo(
    () => ({ domains, search, unread: unreadArg(stateSet) }),
    [domains, search, stateSet]
  )

  const { data: page, loading } = useLastLoaded(
    useQuery(api.admin.notificationsPage, {
      ...filters,
      paginationOpts: { numItems: pageSize, cursor },
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
              values={domains}
              onChange={setDomains}
              onReset={resetPaging}
              clearLabel={tableLabels.resetFilters}
            />
            <MultiFacet
              title={labels.filterRead}
              options={stateOptions}
              values={states}
              onChange={setStates}
              onReset={resetPaging}
              clearLabel={tableLabels.resetFilters}
            />
          </>
        }
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
            <BellIcon className="size-6 text-muted-foreground" />
            <p className="font-medium">{labels.empty}</p>
            <p className="text-sm text-muted-foreground">{labels.emptyHint}</p>
          </div>
        }
      />
    </div>
  )
}
