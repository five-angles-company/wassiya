"use client"

import { useMemo } from "react"
import { api } from "@workspace/backend/api"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { ACTIVATION } from "@/features/dashboard/strings/activation"
import { fmtDate, fmtNumber } from "@/lib/format"

const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_DAYS = 90

/**
 * Sign-ups per day over the last ninety days.
 *
 * ## The window is computed once, on the client, and passed down
 *
 * `admin.signups` takes `from` and `to` as arguments because a Convex query is
 * not rerun when time passes — a window derived from the server's own clock
 * would freeze at whatever it was when the query last ran. `useMemo` with an
 * empty dependency list pins the window to this mount, which also stops the
 * query key changing on every render and re-subscribing in a loop.
 *
 * Days with no sign-ups are filled in as zero rather than omitted, so the gap
 * between two active days reads as a quiet week rather than as a shorter
 * timeline.
 */
export function SignupsChart() {
  const locale = useLocale()
  const labels = t(ACTIVATION, locale)

  const window = useMemo(() => {
    // Reading the clock during render is impure, and normally the fix is to
    // move it into an effect. Not here: the value has to exist on the *first*
    // render because it is the query's argument, and an effect would mean one
    // render with no window, a subscription, then a second subscription with a
    // different key. Pinned to mount by the empty dependency list, which is
    // also what keeps the query key stable. `apps/web`'s claim page reaches for
    // the same escape hatch, for the same reason.
    // eslint-disable-next-line react-hooks/purity
    const to = Math.floor(Date.now() / DAY_MS) * DAY_MS + DAY_MS
    return { from: to - WINDOW_DAYS * DAY_MS, to }
  }, [])

  const signups = useQuery(api.admin.signups, window)

  const data = useMemo(() => {
    if (signups === undefined) return []
    const counts = new Map(signups.days.map((row) => [row.day, row.count]))
    const out: { day: number; count: number }[] = []
    for (let day = window.from; day < window.to; day += DAY_MS) {
      out.push({ day, count: counts.get(day) ?? 0 })
    }
    return out
  }, [signups, window])

  const config = {
    count: { label: labels.signupsAxis, color: "var(--chart-1)" },
  } satisfies ChartConfig

  const empty = signups !== undefined && signups.total === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">
          {labels.signupsTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {signups === undefined ? (
          <Skeleton className="h-64 w-full" />
        ) : empty ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            {labels.signupsEmpty}
          </div>
        ) : (
          <ChartContainer config={config} className="h-64 w-full">
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{ left: 4, right: 4 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                minTickGap={48}
                tickFormatter={(value: number) => fmtDate(value, locale)}
                // Time runs left-to-right in both scripts here: the axis is a
                // number line, and mirroring it would put the newest day on the
                // left, which no chart convention does.
                reversed={false}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={36}
                allowDecimals={false}
                tickFormatter={(value: number) => fmtNumber(value, locale)}
                orientation={locale === "ar" ? "right" : "left"}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) =>
                      fmtDate(Number(payload?.[0]?.payload?.day ?? 0), locale)
                    }
                  />
                }
              />
              <Area
                dataKey="count"
                type="monotone"
                stroke="var(--color-count)"
                strokeWidth={2}
                fill="var(--color-count)"
                fillOpacity={0.15}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
