"use client"

import Link from "next/link"
import type { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import type { FunctionReturnType } from "convex/server"

import { RELEASES } from "@/features/releases/strings/releases"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtDate, fmtNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

type Pipeline = FunctionReturnType<typeof api.admin.releasesPipeline>
export type CountingRow = Pipeline["counting"][number]
export type ReleasedRow = Pipeline["released"][number]

const DAY_MS = 24 * 60 * 60 * 1000

const counting = createColumnHelper<DataTableFeatures, CountingRow>()
const released = createColumnHelper<DataTableFeatures, ReleasedRow>()

/** Owner over email, the shape every list in this console uses for a person. */
function Subject({ name, email }: { name: string | null; email: string | null }) {
  return (
    <div className="flex flex-col">
      <span className="font-medium">{name}</span>
      <span dir="ltr" className="inline-block text-xs text-muted-foreground">
        {email}
      </span>
    </div>
  )
}

export function countingColumns(
  locale: Locale
): ColumnDef<DataTableFeatures, CountingRow>[] {
  const labels = t(RELEASES, locale)

  return counting.columns([
    counting.accessor("subjectName", {
      id: "subject",
      enableSorting: false,
      header: () => labels.colOwner,
      cell: ({ row }) => (
        <Subject name={row.original.subjectName} email={row.original.subjectEmail} />
      ),
    }),
    counting.accessor("claimantName", {
      id: "claimant",
      enableSorting: false,
      header: () => labels.colClaimant,
      cell: ({ row }) => (
        <Link href={`/claims/${row.original.id}`} className="hover:underline">
          {row.original.claimantName}
        </Link>
      ),
    }),
    // The number the band is read for, so it gets its own column with a
    // header rather than being crammed into a row's trailing slot.
    counting.accessor("remainingMs", {
      id: "remaining",
      enableSorting: false,
      header: () => labels.colRemaining,
      cell: ({ row }) => {
        const days = Math.floor(row.original.remainingMs / DAY_MS)
        if (row.original.remainingMs < 0) {
          return (
            <Badge variant="destructive" className="whitespace-nowrap">
              {labels.overdueSweep}
            </Badge>
          )
        }
        return (
          <span className="font-medium tabular-nums">
            {days === 0
              ? labels.remainingToday
              : labels.remainingDays.replace("{n}", fmtNumber(days, locale))}
          </span>
        )
      },
    }),
    counting.accessor("vetoDeadline", {
      id: "deadline",
      enableSorting: false,
      header: () => labels.colDeadline,
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums text-muted-foreground">
          {row.original.vetoDeadline === null
            ? "—"
            : fmtDate(row.original.vetoDeadline, locale)}
        </span>
      ),
    }),
  ])
}

export function releasedColumns(
  locale: Locale
): ColumnDef<DataTableFeatures, ReleasedRow>[] {
  const labels = t(RELEASES, locale)

  return released.columns([
    released.accessor("subjectName", {
      id: "subject",
      enableSorting: false,
      header: () => labels.colOwner,
      cell: ({ row }) => (
        <Subject name={row.original.subjectName} email={row.original.subjectEmail} />
      ),
    }),
    released.accessor("claimantName", {
      id: "claimant",
      enableSorting: false,
      header: () => labels.colClaimant,
      cell: ({ row }) => (
        <Link href={`/claims/${row.original.id}`} className="hover:underline">
          {row.original.claimantName}
        </Link>
      ),
    }),
    // What reached the heirs. Zero deliveries on a released report means the
    // owner's device never built a bundle — nobody receives anything.
    released.accessor("deliveries", {
      id: "delivery",
      enableSorting: false,
      header: () => labels.colDelivery,
      cell: ({ row }) => {
        const d = row.original.deliveries
        if (d.total === 0) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="whitespace-nowrap">
                  {labels.deliveryNone}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{labels.deliveryNoneHint}</TooltipContent>
            </Tooltip>
          )
        }
        return (
          <Link href="/deliveries" className="whitespace-nowrap tabular-nums hover:underline">
            {labels.deliverySummary
              .replace("{ready}", fmtNumber(d.ready, locale))
              .replace("{total}", fmtNumber(d.total, locale))}
          </Link>
        )
      },
    }),
    released.accessor("releasedAt", {
      id: "releasedAt",
      enableSorting: false,
      header: () => labels.colReleased,
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums text-muted-foreground">
          {fmtDate(row.original.releasedAt, locale)}
        </span>
      ),
    }),
  ])
}
