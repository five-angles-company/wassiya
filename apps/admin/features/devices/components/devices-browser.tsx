"use client"

import { useMemo } from "react"
import Link from "next/link"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  createColumnHelper,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import type { FunctionReturnType } from "convex/server"
import { useQuery } from "convex/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { MoreHorizontalIcon, SmartphoneIcon } from "lucide-react"
import {
  parseAsArrayOf,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs"

import { DataTable } from "@/components/data-table"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { FacetedFilter } from "@/components/data-table-faceted-filter"
import { useLocale } from "@/components/locale-provider"
import { MultiFacet } from "@/components/multi-facet"
import { DEVICES } from "@/features/devices/strings/devices"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"
import { useLastLoaded } from "@/lib/use-last-loaded"
import { useTableUrlState } from "@/lib/use-table-url-state"

type DeviceRow = FunctionReturnType<
  typeof api.admin.devicesPage
>["page"][number]

const PLATFORMS = ["ios", "android", "web"] as const
type Platform = (typeof PLATFORMS)[number]

/** Absent is "either" — ticking both sides asks the same question as neither. */
const DEVICE_STATES = ["live", "revoked"] as const

/** The one column the server can order by. */
const SORTABLE = ["registeredAt"] as const

const DEFAULT_SORTING: SortingState = [{ id: "registeredAt", desc: true }]

const helper = createColumnHelper<DataTableFeatures, DeviceRow>()

function deviceColumns(
  locale: Locale
): ColumnDef<DataTableFeatures, DeviceRow>[] {
  const labels = t(DEVICES, locale)

  return helper.columns([
    helper.accessor("name", {
      id: "device",
      enableSorting: false,
      header: () => labels.colDevice,
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          <span className="font-medium">{row.original.name}</span>
          {row.original.revoked && (
            <Badge variant="destructive">{labels.stateRevoked}</Badge>
          )}
        </span>
      ),
    }),

    helper.accessor("platform", {
      id: "platform",
      enableSorting: false,
      header: () => labels.colPlatform,
      cell: ({ row }) => (
        <Badge variant="outline" className="uppercase">
          {row.original.platform}
        </Badge>
      ),
    }),

    helper.accessor("ownerName", {
      id: "owner",
      enableSorting: false,
      header: () => labels.colOwner,
      cell: ({ row }) => (
        <Link
          href={`/owners/${row.original.ownerId}`}
          className="flex flex-col hover:underline"
        >
          <span>{row.original.ownerName}</span>
          <span dir="ltr" className="inline-block text-xs text-muted-foreground">
            {row.original.ownerEmail}
          </span>
        </Link>
      ),
    }),

    // The closest thing the console has to an access log: a device is how a
    // vault is opened day to day, so the last unlock is the last time anyone
    // read this owner's assets at all.
    helper.accessor("lastUnlockAt", {
      id: "lastUnlock",
      enableSorting: false,
      header: () => labels.colLastUnlock,
      cell: ({ row }) =>
        row.original.lastUnlockAt === null ? (
          <span className="text-muted-foreground">{labels.never}</span>
        ) : (
          <span className="whitespace-nowrap tabular-nums">
            {fmtDate(row.original.lastUnlockAt, locale)}
          </span>
        ),
    }),

    helper.display({
      id: "actions",
      enableHiding: false,
      header: () => <span className="sr-only">{labels.colActionsSr}</span>,
      // Navigation and clipboard only. There is deliberately no revoke:
      // nothing anywhere reads `devices.revoked` — not a query, not a
      // mutation, not the app — so the button would set a flag that stops
      // nothing while looking like an intervention. Revocation needs to become
      // a real control before the console offers to perform one.
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs">
              <span className="sr-only">{labels.openMenu}</span>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`/owners/${row.original.ownerId}`}>
                  {labels.actionOpenOwner}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={row.original.ownerEmail === null}
                onClick={() =>
                  void navigator.clipboard.writeText(
                    row.original.ownerEmail ?? ""
                  )
                }
              >
                {labels.actionCopyOwnerEmail}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),

    helper.accessor("registeredAt", {
      id: "registeredAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colRegistered} />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {fmtDate(row.original.registeredAt, locale)}
        </span>
      ),
    }),
  ])
}

/**
 * Every enrolled device, across every account.
 *
 * A device holds MK wrapped by a hardware key, so this is the nearest the
 * console gets to a live access log — and the one place a revoked device reads
 * as a decision somebody made rather than as an absence.
 *
 * Read-only. Revoking is the owner's act, on their own device, and the console
 * deliberately cannot do it for them: `devices.revoke` would be the single most
 * dangerous button in this product, since revoking every device on an account
 * leaves the printed sheet as the only way back in.
 *
 * Search matches the **owner**, not the device. A device is called "iPhone 15"
 * and identifies nobody, so the useful key is the person — the term resolves
 * against `users.search_owner` and narrows this stream by `userId`.
 */
export function DevicesBrowser() {
  const locale = useLocale()
  const labels = useMemo(() => t(DEVICES, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])

  const [facets, setFacets] = useQueryStates(
    {
      platform: parseAsArrayOf(parseAsStringLiteral(PLATFORMS)).withDefault([]),
      state: parseAsStringLiteral(DEVICE_STATES),
    },
    { history: "replace", clearOnDefault: true }
  )
  const url = useTableUrlState({
    defaultSorting: DEFAULT_SORTING,
    sortableIds: SORTABLE,
    facetKey: `${facets.platform.join(",")}|${facets.state}`,
  })

  const platforms = facets.platform as Platform[]
  const revoked = facets.state === null ? undefined : facets.state === "revoked"

  const { data: page, loading } = useLastLoaded(
    useQuery(api.admin.devicesPage, {
      platforms,
      revoked,
      search: url.search,
      sort: url.sorting[0]?.desc === false ? "oldest" : "newest",
      paginationOpts: { numItems: url.pageSize, cursor: url.cursor },
    })
  )
  const { data: tally } = useLastLoaded(
    useQuery(api.admin.devicesTally, {
      platforms,
      revoked,
      search: url.search,
      sort: "newest",
    })
  )

  const columns = useMemo(() => deviceColumns(locale), [locale])
  const columnLabels = useMemo(
    () => ({
      device: labels.colDevice,
      platform: labels.colPlatform,
      owner: labels.colOwner,
      lastUnlock: labels.colLastUnlock,
      registeredAt: labels.colRegistered,
      actions: labels.colActionsSr,
    }),
    [labels]
  )

  /** One boolean worn as a two-value facet — both ticked means "either". */
  const stateSelection = useMemo(
    () =>
      new Set<string>(
        revoked === undefined ? [] : [revoked ? "revoked" : "live"]
      ),
    [revoked]
  )

  if (page === undefined) {
    return <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
  }

  return (
    <DataTable<DeviceRow>
      columns={columns}
      data={page.page}
      busy={loading}
      fill
      searchPlaceholder={labels.searchPlaceholder}
      labels={tableLabels}
      locale={locale}
      columnLabels={columnLabels}
      getRowId={(row) => row.id}
      filters={
        <>
          <MultiFacet
            title={labels.filterPlatform}
            options={PLATFORMS.map((value) => ({ value, label: value }))}
            values={facets.platform}
            onChange={(update) =>
              void setFacets((current) => ({
                platform: update(current.platform),
              }))
            }
            clearLabel={tableLabels.resetFilters}
          />
          <FacetedFilter
            title={labels.filterState}
            options={[
              { value: "live", label: labels.stateLive },
              { value: "revoked", label: labels.stateRevoked },
            ]}
            selected={stateSelection}
            onToggle={(value, checked) =>
              void setFacets((current) => {
                const side = value as (typeof DEVICE_STATES)[number]
                if (!checked) {
                  return { state: current.state === side ? null : current.state }
                }
                return {
                  state:
                    current.state === null || current.state === side
                      ? side
                      : null,
                }
              })
            }
            onClear={() => void setFacets({ state: null })}
            count={() => undefined}
            clearLabel={tableLabels.resetFilters}
          />
        </>
      }
      server={{
        search: url.searchInput,
        onSearchChange: url.setSearch,
        sorting: url.sorting,
        onSortingChange: url.setSorting,
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
          <SmartphoneIcon className="size-6 text-muted-foreground" />
          <p className="font-medium">{labels.empty}</p>
          <p className="text-sm text-muted-foreground">{labels.emptyHint}</p>
        </div>
      }
    />
  )
}
