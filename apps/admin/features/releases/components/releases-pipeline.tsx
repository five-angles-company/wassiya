"use client"

import { useMemo, useState } from "react"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"
import { HourglassIcon, UnlockIcon } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { useLocale } from "@/components/locale-provider"
import { TableCard } from "@/components/table-card"
import {
  countingColumns,
  releasedColumns,
  type CountingRow,
  type ReleasedRow,
} from "@/features/releases/components/releases-columns"
import { RELEASES } from "@/features/releases/strings/releases"
import { fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"

/**
 * ٧ — the release pipeline.
 *
 * **Not a list of bundles**, because none exists: `releaseBundles` has never
 * held a row, since `makeHeirShares`, `buildReleaseBundle` and
 * `release.saveBundles` have no caller in any app. What exists is a pipeline,
 * and this screen shows where it stops.
 *
 * ## Two panels, stacked, in the console's own shape
 *
 * This was a pair of hand-rolled card lists side by side, which was wrong twice
 * over. Side-by-side implies the two are comparable — they are not; one is a
 * countdown and the other a history, with different columns and different
 * questions. And a bespoke row of *name → blob* has no headers, so the numbers
 * that matter had nothing naming them.
 *
 * Both are now `TableCard` + a compact `DataTable`, the same panel the
 * dashboard uses. Compact rather than a full table because each band is
 * bounded: a countdown an operator pages through has stopped being a countdown,
 * and the cap is stated in the footnote when it is reached.
 *
 * Expect the released panel to read as failures. That is the honest state of
 * the product, and this is the only screen where it is visible.
 */
export function ReleasesPipeline() {
  const locale = useLocale()
  const labels = useMemo(() => t(RELEASES, locale), [locale])
  const tableLabels = useMemo(() => t(DATA_TABLE, locale), [locale])

  // Once per mount: the query may not read the clock, and a countdown that
  // disagreed with itself between renders would be worse than a stale one.
  const [now] = useState(() => Date.now())
  const pipeline = useQuery(api.admin.releasesPipeline, { now })

  const counting = useMemo(() => countingColumns(locale), [locale])
  const released = useMemo(() => releasedColumns(locale), [locale])

  if (pipeline === undefined) {
    return <Skeleton className="h-96 w-full rounded-xl" />
  }

  const cap = fmtNumber(pipeline.bandCap, locale)

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-muted-foreground">{labels.intro}</p>

      <TableCard
        title={labels.bandCounting}
        footnote={
          pipeline.countingCapped
            ? labels.capped.replace("{n}", cap)
            : undefined
        }
      >
        <DataTable<CountingRow>
          compact
          columns={counting}
          data={pipeline.counting}
          labels={tableLabels}
          locale={locale}
          columnLabels={{}}
          getRowId={(row) => row.id}
          empty={
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <HourglassIcon className="size-6 text-muted-foreground" />
              <p className="font-medium">{labels.emptyCounting}</p>
            </div>
          }
        />
      </TableCard>

      <TableCard
        title={labels.bandReleased}
        footnote={
          pipeline.releasedCapped
            ? labels.capped.replace("{n}", cap)
            : undefined
        }
      >
        <DataTable<ReleasedRow>
          compact
          columns={released}
          data={pipeline.released}
          labels={tableLabels}
          locale={locale}
          columnLabels={{}}
          getRowId={(row) => row.id}
          empty={
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <UnlockIcon className="size-6 text-muted-foreground" />
              <p className="font-medium">{labels.emptyReleased}</p>
            </div>
          }
        />
      </TableCard>
    </div>
  )
}
