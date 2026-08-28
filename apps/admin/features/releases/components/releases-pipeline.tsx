"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import type { FunctionReturnType } from "convex/server"
import { useQuery } from "convex/react"
import { UnlockIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { RELEASES } from "@/features/releases/strings/releases"
import { fmtDate, fmtNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

type Pipeline = FunctionReturnType<typeof api.admin.releasesPipeline>
type Released = Pipeline["released"][number]

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * The delivery verdict, as three distinct answers.
 *
 * `no-heir` and `no-bundle` are different failures and reporting them as one
 * would blame the wrong thing: the first means nothing *could* have been built,
 * the second means the builder never ran. Today every released row is the
 * first, and a two-state column would have pointed at the bundle path.
 */
function DeliveryBadge({
  delivery,
  locale,
}: {
  delivery: Released["delivery"]
  locale: Locale
}) {
  const labels = t(RELEASES, locale)

  if (delivery === "delivered") {
    return <Badge variant="secondary">{labels.deliveryDelivered}</Badge>
  }

  const [label, hint] =
    delivery === "no-bundle"
      ? [labels.deliveryNoBundle, labels.deliveryNoBundleHint]
      : [labels.deliveryNoHeir, labels.deliveryNoHeirHint]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="destructive">{label}</Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{hint}</TooltipContent>
    </Tooltip>
  )
}

function Band({
  title,
  capped,
  cap,
  locale,
  children,
}: {
  title: string
  capped: boolean
  cap: number
  locale: Locale
  children: React.ReactNode
}) {
  const labels = t(RELEASES, locale)
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex-row items-center justify-between gap-3 border-b py-3">
        <CardTitle className="font-heading text-sm">{title}</CardTitle>
        {capped && (
          <span className="text-xs text-muted-foreground">
            {labels.capped.replace("{n}", fmtNumber(cap, locale))}
          </span>
        )}
      </CardHeader>
      <CardContent className="flex flex-col px-0 py-0">{children}</CardContent>
    </Card>
  )
}

function Row({
  left,
  sub,
  right,
}: {
  left: string
  sub: string | null
  right: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0">
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{left}</span>
        {sub !== null && (
          <span dir="ltr" className="truncate text-xs text-muted-foreground">
            {sub}
          </span>
        )}
      </div>
      <div className="shrink-0 text-end text-sm">{right}</div>
    </div>
  )
}

/**
 * ٧ — the release pipeline.
 *
 * **Not a list of bundles**, because none exists: `releaseBundles` has never
 * held a row, since `makeHeirShares`, `buildReleaseBundle` and
 * `release.saveBundles` have no caller in any app. What exists is a pipeline,
 * and this screen's job is to show where it stops.
 *
 * Two bounded bands rather than a paged table — a countdown an operator pages
 * through has stopped being a countdown — each saying so when it is cut short.
 *
 * Expect the released band to read as failures. That is the honest state of the
 * product, and this is the only screen where it is visible.
 */
export function ReleasesPipeline() {
  const locale = useLocale()
  const labels = t(RELEASES, locale)
  // Once per mount: the query may not read the clock, and a countdown that
  // disagreed with itself between renders would be worse than a stale one.
  const [now] = useState(() => Date.now())
  const pipeline = useQuery(api.admin.releasesPipeline, { now })

  const counting = useMemo(() => pipeline?.counting ?? [], [pipeline])
  const released = useMemo(() => pipeline?.released ?? [], [pipeline])

  if (pipeline === undefined) {
    return <Skeleton className="h-96 w-full rounded-xl" />
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-3xl text-sm text-muted-foreground">{labels.intro}</p>

      <div className="grid gap-4 xl:grid-cols-2">
        <Band
          title={labels.bandCounting}
          capped={pipeline.countingCapped}
          cap={pipeline.bandCap}
          locale={locale}
        >
          {counting.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {labels.emptyCounting}
            </p>
          ) : (
            counting.map((row) => {
              const days = Math.floor(row.remainingMs / DAY_MS)
              return (
                <Row
                  key={row.id}
                  left={row.subjectName ?? row.claimantName}
                  sub={row.subjectEmail}
                  right={
                    <Link
                      href={`/claims/${row.id}`}
                      className="tabular-nums hover:underline"
                    >
                      {/* Negative means the window closed and the hourly job
                          has not caught up — a real state, not an error. */}
                      {row.remainingMs < 0
                        ? labels.overdueSweep
                        : days === 0
                          ? labels.remainingToday
                          : labels.remainingDays.replace(
                              "{n}",
                              fmtNumber(days, locale)
                            )}
                    </Link>
                  }
                />
              )
            })
          )}
        </Band>

        <Band
          title={labels.bandReleased}
          capped={pipeline.releasedCapped}
          cap={pipeline.bandCap}
          locale={locale}
        >
          {released.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {labels.emptyReleased}
            </p>
          ) : (
            released.map((row) => (
              <Row
                key={row.id}
                left={row.subjectName ?? row.claimantName}
                sub={row.subjectEmail}
                right={
                  <span className="flex items-center justify-end gap-2">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {fmtDate(row.releasedAt, locale)}
                    </span>
                    <DeliveryBadge delivery={row.delivery} locale={locale} />
                  </span>
                }
              />
            ))
          )}
        </Band>
      </div>

      {counting.length === 0 && released.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <UnlockIcon className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {labels.emptyCounting}
          </p>
        </div>
      )}
    </div>
  )
}
