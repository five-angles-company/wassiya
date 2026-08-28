"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import {
  createColumnHelper,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import type { FunctionReturnType } from "convex/server"
import { useQuery } from "convex/react"
import { HeartPulseIcon, InfoIcon } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { FacetedFilter } from "@/components/data-table-faceted-filter"
import { useLocale } from "@/components/locale-provider"
import { CHECKINS } from "@/features/checkins/strings/checkins"
import type { DataTableFeatures } from "@/lib/data-table-features"
import {
  ESCALATION_STATES,
  escalationLabel,
  escalationVariant,
  type EscalationState,
} from "@/lib/escalation"
import { fmtDate, fmtNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"
import { useLastLoaded } from "@/lib/use-last-loaded"

type CheckinRow = FunctionReturnType<
  typeof api.admin.checkinsPage
>["page"][number]

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_SORTING: SortingState = [{ id: "nextDueAt", desc: false }]

const helper = createColumnHelper<DataTableFeatures, CheckinRow>()

function checkinColumns(
  locale: Locale
): ColumnDef<DataTableFeatures, CheckinRow>[] {
  const labels = t(CHECKINS, locale)

  return helper.columns([
    helper.accessor("ownerName", {
      id: "owner",
      enableSorting: false,
      header: () => labels.colOwner,
      cell: ({ row }) => (
        <Link
          href={`/owners/${row.original.ownerId}`}
          className="flex flex-col hover:underline"
        >
          <span className="font-medium">{row.original.ownerName}</span>
          <span dir="ltr" className="inline-block text-xs text-muted-foreground">
            {row.original.ownerEmail}
          </span>
        </Link>
      ),
    }),

    helper.accessor("escalationState", {
      id: "state",
      enableSorting: false,
      header: () => labels.colState,
      cell: ({ row }) => {
        const state = row.original.escalationState as EscalationState
        return (
          <span className="flex items-center gap-1.5">
            <Badge
              variant={escalationVariant(state)}
              className="whitespace-nowrap"
            >
              {escalationLabel(state, locale)}
            </Badge>
            {/* The rung whose email promises something nothing does. Marked on
                the row rather than in a footnote, because an operator reading
                four owners in this state should not have to know that
                separately. */}
            {state === "day14" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-label={labels.day14Gap}
                  />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  {labels.day14Gap}
                </TooltipContent>
              </Tooltip>
            )}
          </span>
        )
      },
    }),

    // The number the screen is read for. Positive is late; negative is a
    // deadline still ahead, which is most rows and must not read as overdue.
    helper.accessor("overdueMs", {
      id: "overdue",
      enableSorting: false,
      header: () => labels.colOverdue,
      cell: ({ row }) => {
        const days = Math.floor(Math.abs(row.original.overdueMs) / DAY_MS)
        if (row.original.overdueMs < 0) {
          return (
            <span className="text-muted-foreground">
              {labels.dueIn.replace("{n}", fmtNumber(days, locale))}
            </span>
          )
        }
        if (days === 0) {
          return <span className="tabular-nums">{labels.dueToday}</span>
        }
        return (
          <span className="text-destructive tabular-nums">
            {labels.overdueBy.replace("{n}", fmtNumber(days, locale))}
          </span>
        )
      },
    }),

    helper.accessor("nextDueAt", {
      id: "nextDueAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colDue} />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {fmtDate(row.original.nextDueAt, locale)}
        </span>
      ),
    }),

    helper.accessor("cadenceMonths", {
      id: "cadence",
      enableSorting: false,
      header: () => labels.colCadence,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {labels.cadence.replace(
            "{n}",
            fmtNumber(row.original.cadenceMonths, locale)
          )}
        </span>
      ),
    }),

    helper.accessor("lastConfirmedAt", {
      id: "confirmed",
      enableSorting: false,
      header: () => labels.colConfirmed,
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums text-muted-foreground">
          {fmtDate(row.original.lastConfirmedAt, locale)}
        </span>
      ),
    }),
  ])
}

/**
 * ٦.٤ from the console's side: who is overdue, at which rung, and since when.
 *
 * `admin.overview` has always counted these by state, so the dashboard could
 * say *six owners are mid-escalation* while nothing anywhere could say **which
 * six**. Third time that gap has turned up in this console; the identity queue
 * and the claims workspace were the others.
 *
 * Ordered by due date through `by_nextDueAt` rather than the compound index —
 * that one leads on the state, so it cannot order across several states or
 * none, and "who is furthest past due" has to mean one thing however the rungs
 * are filtered.
 */
export function CheckinsBrowser() {
  const locale = useLocale()
  const labels = useMemo(() => t(CHECKINS, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])

  // Once per mount. A query may not read the clock, and two renders
  // disagreeing about "days overdue" would be a row that flickers.
  const [now] = useState(() => Date.now())
  const [states, setStates] = useState<EscalationState[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING)
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

  const sort: "soonest" | "latest" =
    sorting[0]?.desc === true ? "latest" : "soonest"
  const filters = useMemo(
    () => ({ states, search, sort, now }),
    [states, search, sort, now]
  )

  const { data: page, loading } = useLastLoaded(
    useQuery(api.admin.checkinsPage, {
      ...filters,
      paginationOpts: { numItems: pageSize, cursor },
    })
  )
  const { data: tally } = useLastLoaded(
    useQuery(api.admin.checkinsTally, filters)
  )

  const columns = useMemo(() => checkinColumns(locale), [locale])
  const columnLabels = useMemo(
    () => ({
      owner: labels.colOwner,
      state: labels.colState,
      overdue: labels.colOverdue,
      nextDueAt: labels.colDue,
      cadence: labels.colCadence,
      confirmed: labels.colConfirmed,
    }),
    [labels]
  )
  const stateSelection = useMemo(() => new Set<string>(states), [states])

  if (page === undefined) {
    return <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
  }

  return (
    <DataTable<CheckinRow>
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
        <FacetedFilter
          title={labels.filterState}
          options={ESCALATION_STATES.map((value) => ({
            value,
            label: escalationLabel(value, locale),
          }))}
          selected={stateSelection}
          onToggle={(value, checked) => {
            setStates((current) => {
              const next = new Set(current)
              if (checked) next.add(value as EscalationState)
              else next.delete(value as EscalationState)
              return [...next]
            })
            resetPaging()
          }}
          onClear={() => {
            setStates([])
            resetPaging()
          }}
          count={() => undefined}
          clearLabel={tableLabels.resetFilters}
        />
      }
      server={{
        search: searchInput,
        onSearchChange: setSearchInput,
        sorting,
        onSortingChange: (next) => {
          setSorting(next.length === 0 ? DEFAULT_SORTING : next)
          resetPaging()
        },
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
        onNext: () => setCursors((current) => [...current, page.continueCursor]),
        total: tally,
        loading,
      }}
      bulk={{
        exportName: "checkins",
        rowId: (row) => row.id,
        csvColumns: [
          { header: labels.colOwner, value: (row) => row.ownerName },
          { header: "email", value: (row) => row.ownerEmail },
          { header: labels.colState, value: (row) => row.escalationState },
          {
            header: labels.colDue,
            value: (row) => fmtDate(row.nextDueAt, locale),
          },
          {
            header: labels.colOverdue,
            value: (row) => Math.floor(row.overdueMs / DAY_MS),
          },
        ],
      }}
      empty={
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <HeartPulseIcon className="size-6 text-muted-foreground" />
          <p className="font-medium">{labels.empty}</p>
          <p className="text-sm text-muted-foreground">{labels.emptyHint}</p>
        </div>
      }
    />
  )
}
