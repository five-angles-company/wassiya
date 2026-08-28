"use client"

import { useMemo } from "react"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"
import { InboxIcon } from "lucide-react"

import {
  claimColumnLabels,
  claimColumns,
} from "@/features/claims/components/claims-columns"
import { TableCard } from "@/components/table-card"
import { DataTable } from "@/components/data-table"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { CLAIMS } from "@/features/claims/strings/claims"
import { DATA_TABLE } from "@/lib/i18n/strings/data-table"
import { fmtNumber } from "@/lib/format"

/** How many rows a dashboard panel shows before it stops being a summary. */
const PREVIEW_ROWS = 5

/**
 * The five newest claims awaiting review.
 *
 * A dashboard panel is a summary, not the workspace: a hundred-row table on the
 * landing page buries the four other sections under it and still is not where
 * anyone would actually work a queue. Newest first, because a claim that
 * arrived this morning is the one nobody has looked at yet.
 *
 * `claims.pendingReview` is `submitted`-only, which is the whole queue that
 * exists today — no other status has an admin read. Worth knowing when this
 * looks empty: it means nothing has arrived, not that nothing is in flight.
 */
export function ClaimsQueue() {
  const locale = useLocale()
  const labels = t(CLAIMS, locale)
  const common = t(COMMON, locale)
  const table = t(DATA_TABLE, locale)
  const claims = useQuery(api.claims.pendingReview)

  const columns = useMemo(() => claimColumns(locale), [locale])
  const columnLabels = useMemo(() => claimColumnLabels(locale), [locale])

  const newest = useMemo(
    () =>
      [...(claims ?? [])]
        .sort((a, b) => b.submittedAt - a.submittedAt)
        .slice(0, PREVIEW_ROWS),
    [claims]
  )

  if (claims === undefined) {
    return <Skeleton className="h-72 w-full rounded-xl" />
  }

  return (
    <TableCard
      title={labels.queueTitle}
      footnote={
        claims.length > PREVIEW_ROWS
          ? common.showingOf
              .replace("{n}", fmtNumber(newest.length, locale))
              .replace("{total}", fmtNumber(claims.length, locale))
          : undefined
      }
    >
      <DataTable
        compact
        columns={columns}
        data={newest}
        labels={table}
        locale={locale}
        columnLabels={columnLabels}
        empty={
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <InboxIcon className="size-6 text-muted-foreground" />
            <p className="font-medium">{labels.empty}</p>
            <p className="text-sm text-muted-foreground">{labels.emptyHint}</p>
          </div>
        }
      />
    </TableCard>
  )
}
