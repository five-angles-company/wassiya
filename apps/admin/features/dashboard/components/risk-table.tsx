"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { ShieldCheckIcon } from "lucide-react"

import type { RiskData } from "@/features/dashboard/components/risk-section"
import { TableCard } from "@/components/table-card"
import { useLocale } from "@/components/locale-provider"
import { t, type Locale } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { RISK } from "@/features/dashboard/strings/risk"
import { fmtNumber } from "@/lib/format"

/** How many rows a dashboard panel shows before it stops being a summary. */
const PREVIEW_ROWS = 5

/**
 * The six protection items, labelled.
 *
 * Keys match `admin.risk`'s `missing` array exactly, which in turn matches
 * `apps/mobile/hooks/use-protection-score.ts`. If a key ever fails to resolve
 * here, the two have drifted and that is worth seeing rather than silently
 * rendering an id.
 */
function itemLabel(key: string, locale: Locale): string {
  const labels = t(RISK, locale)
  const map: Record<string, string> = {
    identity: labels.itemIdentity,
    key: labels.itemKey,
    sheet: labels.itemSheet,
    executors: labels.itemExecutors,
    delivery: labels.itemDelivery,
    checkin: labels.itemCheckin,
  }
  return map[key] ?? key
}

/** A fraction is one LTR run — an Arabic-Indic numerator stays left of the slash. */
function Fraction({ top, bottom }: { top: string; bottom: string }) {
  return (
    <span dir="ltr" className="inline-block tabular-nums">
      {top}/{bottom}
    </span>
  )
}

/**
 * The five owners furthest from protected.
 *
 * `admin.risk` already returns them worst-first — fewest items earned, then most
 * executors without a printed sheet — so this takes the head of that list
 * rather than re-sorting. Five, because the panel's job is to say *whether*
 * there is a problem and who is worst; working through forty is a different
 * screen.
 */
export function RiskTable({ risk }: { risk: RiskData | undefined }) {
  const locale = useLocale()
  const labels = t(RISK, locale)
  const common = t(COMMON, locale)

  if (risk === undefined) {
    return <Skeleton className="h-72 w-full rounded-xl" />
  }

  if (risk.rows.length === 0) {
    return (
      <TableCard title={labels.tableTitle}>
        <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
          <ShieldCheckIcon className="size-6 text-muted-foreground" />
          <p className="font-medium">{labels.empty}</p>
          <p className="text-sm text-muted-foreground">{labels.emptyHint}</p>
        </div>
      </TableCard>
    )
  }

  const rows = risk.rows.slice(0, PREVIEW_ROWS)

  return (
    <TableCard
      title={labels.tableTitle}
      footnote={
        risk.rows.length > PREVIEW_ROWS
          ? common.showingOf
              .replace("{n}", fmtNumber(rows.length, locale))
              .replace("{total}", fmtNumber(risk.rows.length, locale))
          : undefined
      }
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">{labels.colOwner}</TableHead>
              <TableHead className="text-start">{labels.colScore}</TableHead>
              <TableHead className="text-start">{labels.colWorstGap}</TableHead>
              <TableHead className="text-start">{labels.colMissing}</TableHead>
              <TableHead className="text-start">
                {labels.colExecutorsWithoutSheet}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.userId}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{row.name ?? "—"}</span>
                    {/* An address is a machine string: LTR even inside Arabic. */}
                    <span
                      dir="ltr"
                      className="inline-block text-xs text-muted-foreground"
                    >
                      {row.email ?? "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Fraction
                    top={fmtNumber(row.earned, locale)}
                    bottom={fmtNumber(row.total, locale)}
                  />
                </TableCell>
                <TableCell>
                  {row.worstGap === null ? (
                    "—"
                  ) : (
                    // The one-amber rule from the app: exactly one gap is
                    // called out, and the rest are listed plainly beside it.
                    <Badge variant="destructive" className="whitespace-nowrap">
                      {itemLabel(row.worstGap, locale)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {row.missing.slice(1).map((item) => (
                      <Badge key={item} variant="outline">
                        {itemLabel(item, locale)}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {row.executorsWithoutSheet === 0 ? (
                    "—"
                  ) : (
                    <Fraction
                      top={fmtNumber(row.executorsWithoutSheet, locale)}
                      bottom={fmtNumber(row.executorCount, locale)}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableCard>
  )
}
