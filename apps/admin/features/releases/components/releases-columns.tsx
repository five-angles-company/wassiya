"use client"

import Link from "next/link"
import type { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import type { FunctionReturnType } from "convex/server"

import { RELEASES } from "@/features/releases/strings/releases"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtDate, fmtNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

export type ReleaseRow = FunctionReturnType<
  typeof api.admin.releasesTable
>["rows"][number]

export const RELEASE_BANDS = ["counting", "released"] as const

const DAY_MS = 24 * 60 * 60 * 1000

const helper = createColumnHelper<DataTableFeatures, ReleaseRow>()

/** Owner over email, the shape every list in this console uses for a person. */
function Subject({
  name,
  email,
}: {
  name: string | null
  email: string | null
}) {
  return (
    <div className="flex flex-col">
      <span className="font-medium">{name}</span>
      <span dir="ltr" className="inline-block text-xs text-muted-foreground">
        {email}
      </span>
    </div>
  )
}

export function bandLabel(band: ReleaseRow["band"], locale: Locale): string {
  const labels = t(RELEASES, locale)
  return band === "counting" ? labels.bandCounting : labels.bandReleased
}

/** A dash, not a blank: an empty cell reads as missing data rather than N/A. */
function NotApplicable() {
  return <span className="text-muted-foreground">—</span>
}

/**
 * One column set for both bands.
 *
 * Each band fills half the row and leaves the other half null, so four of these
 * columns are a dash on any given row. That is deliberate and it is why the band
 * is the second column: the badge tells you which half of the row to read, and
 * column visibility hides the rest once an operator has faceted to one band.
 *
 * The alternative was two tables, which is what this screen used to be — and it
 * cost it search, column visibility, export and a single empty state.
 */
export function releaseColumns(
  locale: Locale
): ColumnDef<DataTableFeatures, ReleaseRow>[] {
  const labels = t(RELEASES, locale)

  return helper.columns([
    helper.accessor("subjectName", {
      id: "subject",
      enableSorting: false,
      header: () => labels.colOwner,
      cell: ({ row }) => (
        <Subject
          name={row.original.subjectName}
          email={row.original.subjectEmail}
        />
      ),
    }),

    helper.accessor("band", {
      id: "band",
      enableSorting: false,
      header: () => labels.colBand,
      cell: ({ row }) => (
        <Badge
          variant={row.original.band === "counting" ? "secondary" : "outline"}
          className="whitespace-nowrap"
        >
          {bandLabel(row.original.band, locale)}
        </Badge>
      ),
    }),

    helper.accessor("claimantName", {
      id: "claimant",
      enableSorting: false,
      header: () => labels.colClaimant,
      cell: ({ row }) => (
        <Link href={`/claims/${row.original.id}`} className="hover:underline">
          {row.original.claimantName}
        </Link>
      ),
    }),

    // The number the counting band is read for.
    helper.accessor("remainingMs", {
      id: "remaining",
      enableSorting: false,
      header: () => labels.colRemaining,
      cell: ({ row }) => {
        const remaining = row.original.remainingMs
        if (remaining === null) {
          return <NotApplicable />
        }
        if (remaining < 0) {
          return (
            <Badge variant="destructive" className="whitespace-nowrap">
              {labels.overdueSweep}
            </Badge>
          )
        }
        const days = Math.floor(remaining / DAY_MS)
        return (
          <span className="font-medium tabular-nums">
            {days === 0
              ? labels.remainingToday
              : labels.remainingDays.replace("{n}", fmtNumber(days, locale))}
          </span>
        )
      },
    }),

    // A report counting down with no executor, or none holding a printed sheet,
    // will release on schedule and reach nobody who can open it. It is the one
    // genuinely alarming row this screen can show, so it is a column rather
    // than something an operator has to go and check.
    helper.accessor("executors", {
      id: "delivery",
      enableSorting: false,
      header: () => labels.colDelivery,
      cell: ({ row }) => {
        const executors = row.original.executors
        const deliveries = row.original.deliveries

        if (deliveries !== null) {
          if (deliveries.total === 0) {
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="destructive" className="whitespace-nowrap">
                    {labels.deliveryNone}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  {labels.deliveryNoneHint}
                </TooltipContent>
              </Tooltip>
            )
          }
          return (
            <Link
              href={`/deliveries?claim=${row.original.id}`}
              className="whitespace-nowrap tabular-nums hover:underline"
            >
              {labels.deliverySummary
                .replace("{ready}", fmtNumber(deliveries.ready, locale))
                .replace("{total}", fmtNumber(deliveries.total, locale))}
            </Link>
          )
        }

        if (executors === null) {
          return <NotApplicable />
        }
        if (executors.total === 0) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="whitespace-nowrap">
                  {labels.executorsNone}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {labels.deliveryNoneHint}
              </TooltipContent>
            </Tooltip>
          )
        }
        const summary = (
          <span
            className={cn(
              "whitespace-nowrap tabular-nums",
              executors.withSheet === 0 && "text-destructive"
            )}
          >
            {labels.executorsWithSheet
              .replace("{n}", fmtNumber(executors.withSheet, locale))
              .replace("{total}", fmtNumber(executors.total, locale))}
          </span>
        )
        return executors.withSheet === 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>{summary}</TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {labels.noSheetHint}
            </TooltipContent>
          </Tooltip>
        ) : (
          summary
        )
      },
    }),

    helper.accessor("vetoDeadline", {
      id: "deadline",
      enableSorting: false,
      header: () => labels.colDeadline,
      cell: ({ row }) =>
        row.original.vetoDeadline === null ? (
          <NotApplicable />
        ) : (
          <span className="whitespace-nowrap text-muted-foreground tabular-nums">
            {fmtDate(row.original.vetoDeadline, locale)}
          </span>
        ),
    }),

    helper.accessor("releasedAt", {
      id: "releasedAt",
      enableSorting: false,
      header: () => labels.colReleased,
      cell: ({ row }) =>
        row.original.releasedAt === null ? (
          <NotApplicable />
        ) : (
          <span className="whitespace-nowrap text-muted-foreground tabular-nums">
            {fmtDate(row.original.releasedAt, locale)}
          </span>
        ),
    }),
  ])
}

/** Column id → label, for the visibility menu. */
export function releaseColumnLabels(locale: Locale): Record<string, string> {
  const labels = t(RELEASES, locale)
  return {
    subject: labels.colOwner,
    band: labels.colBand,
    claimant: labels.colClaimant,
    remaining: labels.colRemaining,
    delivery: labels.colDelivery,
    deadline: labels.colDeadline,
    releasedAt: labels.colReleased,
  }
}
