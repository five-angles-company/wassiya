"use client"

import { useMemo, useState } from "react"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"
import { GavelIcon, InfoIcon } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { FacetedFilter } from "@/components/data-table-faceted-filter"
import { useLocale } from "@/components/locale-provider"
import {
  guardianColumnLabels,
  guardianColumns,
  type GuardianRow,
} from "@/features/guardians/components/guardians-columns"
import {
  GUARDIAN_STATES,
  guardianStateLabel,
  type GuardianState,
} from "@/features/guardians/lib/state"
import { GUARDIANS } from "@/features/guardians/strings/guardians"
import { fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { useLastLoaded } from "@/lib/use-last-loaded"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"

/**
 * ٦.٢ from the console's side: every guardian appointment and whether it works.
 *
 * ## Why this one is not server-paginated, unlike claims and identity
 *
 * The state an operator filters on is **derived** — `expired` is
 * `invited` plus a clock, `live` is `accepted` plus a published key — and
 * neither is expressible as an index range. Cursor pagination over a
 * post-filtered stream returns arbitrarily short pages and an `isDone` that
 * stops meaning anything, so the query returns a bounded scan instead and the
 * table pages it in the browser.
 *
 * That is the better answer here rather than a concession: guardians are
 * bounded by *owners* — one or two per vault — not by traffic, so the whole set
 * fits comfortably. And paging it client-side gives back the two things a
 * cursor cannot, a real page count and a real total. The scan cap is surfaced
 * if it is ever hit.
 */
export function GuardiansBrowser() {
  const locale = useLocale()
  const labels = useMemo(() => t(GUARDIANS, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])

  // Captured once per mount. A query may not read the clock, so `now` is an
  // argument — and a fresh `Date.now()` each render would be a new argument
  // each render, which is a new subscription each render. Expiry is measured
  // in days; a stale-by-minutes boundary is not a real inaccuracy.
  const [now] = useState(() => Date.now())
  const [states, setStates] = useState<GuardianState[]>([])

  // Same reason as the other two: changing the state filter is a new
  // subscription, and rendering its `undefined` unmounted the table.
  const { data: result, loading } = useLastLoaded(
    useQuery(api.admin.guardiansList, { states, now, sort: "newest" })
  )

  const columns = useMemo(() => guardianColumns(locale), [locale])
  const columnLabels = useMemo(() => guardianColumnLabels(locale), [locale])
  const stateSelection = useMemo(() => new Set<string>(states), [states])

  if (result === undefined) {
    return <Skeleton className="min-h-0 w-full flex-1 rounded-xl" />
  }

  return (
    // `min-h-0` so the banners keep their natural height and the table takes
    // whatever is left, rather than the column growing to fit every row.
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* Why the table is full of expired invitations. Without this the screen
          reads as owners neglecting their guardians, when in fact there is no
          way to accept one yet. */}
      <div className="flex gap-3 rounded-xl border bg-muted/40 p-4">
        <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">{labels.webPendingTitle}</p>
          <p className="text-sm text-muted-foreground">{labels.webPendingBody}</p>
        </div>
      </div>

      {result.capped && (
        <div className="rounded-xl border border-destructive/40 p-4">
          <p className="text-sm font-medium">{labels.cappedTitle}</p>
          <p className="text-sm text-muted-foreground">
            {labels.cappedBody.replace(
              "{n}",
              fmtNumber(result.scanCap, locale)
            )}
          </p>
        </div>
      )}

      <DataTable<GuardianRow>
        columns={columns}
        data={result.rows}
        labels={tableLabels}
        locale={locale}
        columnLabels={columnLabels}
        getRowId={(row) => row.id}
        fill
        // Searches the whole set, not a page — this table is client-side over a
        // bounded scan, so every row it could match is already loaded. That is
        // the one place a client-side filter is *more* honest than a server
        // one: no cap to warn about, no window to fall outside of.
        searchPlaceholder={labels.searchPlaceholder}
        busy={loading}
        initialPageSize={25}
        filters={
          <FacetedFilter
            title={labels.colState}
            options={GUARDIAN_STATES.map((value) => ({
              value,
              label: guardianStateLabel(value, locale),
            }))}
            selected={stateSelection}
            onToggle={(value, checked) =>
              setStates((current) => {
                const next = new Set(current)
                if (checked) next.add(value as GuardianState)
                else next.delete(value as GuardianState)
                return [...next]
              })
            }
            onClear={() => setStates([])}
            count={() => undefined}
            clearLabel={tableLabels.resetFilters}
          />
        }
        bulk={{
          exportName: "guardians",
          rowId: (row) => row.id,
          csvColumns: [
            { header: "id", value: (row) => row.id },
            { header: labels.colOwner, value: (row) => row.ownerName },
            { header: "owner email", value: (row) => row.ownerEmail },
            { header: labels.colGuardian, value: (row) => row.guardianName },
            { header: labels.colRelation, value: (row) => row.relation },
            { header: labels.colState, value: (row) => row.state },
          ],
        }}
        empty={
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <GavelIcon className="size-6 text-muted-foreground" />
            <p className="font-medium">{labels.empty}</p>
            <p className="text-sm text-muted-foreground">{labels.emptyHint}</p>
          </div>
        }
      />
    </div>
  )
}
