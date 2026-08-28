"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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

import { DataTable } from "@/components/data-table"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { FacetedFilter } from "@/components/data-table-faceted-filter"
import { useLocale } from "@/components/locale-provider"
import { DEVICES } from "@/features/devices/strings/devices"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"
import { useLastLoaded } from "@/lib/use-last-loaded"

type DeviceRow = FunctionReturnType<
  typeof api.admin.devicesPage
>["page"][number]

type Platform = "ios" | "android" | "web"
const PLATFORMS: Platform[] = ["ios", "android", "web"]

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

  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [revoked, setRevoked] = useState<boolean | undefined>(undefined)
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

  const { data: page, loading } = useLastLoaded(
    useQuery(api.admin.devicesPage, {
      platforms,
      revoked,
      search,
      sort: sorting[0]?.desc === false ? "oldest" : "newest",
      paginationOpts: { numItems: pageSize, cursor },
    })
  )
  const { data: tally } = useLastLoaded(
    useQuery(api.admin.devicesTally, {
      platforms,
      revoked,
      search,
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

  const platformSelection = useMemo(
    () => new Set<string>(platforms),
    [platforms]
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
          <FacetedFilter
            title={labels.filterPlatform}
            options={PLATFORMS.map((value) => ({ value, label: value }))}
            selected={platformSelection}
            onToggle={(value, checked) => {
              setPlatforms((current) => {
                const next = new Set(current)
                if (checked) next.add(value as Platform)
                else next.delete(value as Platform)
                return [...next]
              })
              resetPaging()
            }}
            onClear={() => {
              setPlatforms([])
              resetPaging()
            }}
            count={() => undefined}
            clearLabel={tableLabels.resetFilters}
          />
          <FacetedFilter
            title={labels.filterState}
            options={[
              { value: "live", label: labels.stateLive },
              { value: "revoked", label: labels.stateRevoked },
            ]}
            selected={stateSelection}
            onToggle={(value, checked) => {
              const side = value === "revoked"
              setRevoked((current) => {
                if (!checked) return current === side ? undefined : current
                return current === undefined || current === side
                  ? side
                  : undefined
              })
              resetPaging()
            }}
            onClear={() => {
              setRevoked(undefined)
              resetPaging()
            }}
            count={() => undefined}
            clearLabel={tableLabels.resetFilters}
          />
        </>
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
