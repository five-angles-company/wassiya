"use client"

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
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts"

import { useLocale } from "@/components/locale-provider"
import { t, type Locale } from "@/lib/i18n/locale"
import { barValueLabel } from "@/features/dashboard/components/bar-value-label"
import { ACTIVATION } from "@/features/dashboard/strings/activation"
import { fmtNumber } from "@/lib/format"

/**
 * A horizontal bar per funnel stage, longest at the top.
 *
 * **One series, one colour.** The stages are not identities that need telling
 * apart — they are one measure at seven points, and the y-axis already names
 * each. Colouring them differently would be decoration that the Organic palette
 * cannot even carry: terracotta against olive measures ΔE 12.1 under normal
 * vision and 5.2 under deuteranopia, so a categorical encoding here would be
 * unreadable to a colourblind operator. Identity stays in the labels.
 *
 * Horizontal rather than vertical because the stage names are long Arabic
 * phrases; rotated tick labels on a vertical chart are the anti-pattern this
 * avoids.
 *
 * ## Under RTL the whole chart mirrors, not just the axis
 *
 * Three things have to move together, and moving one alone is worse than
 * moving none:
 *
 *  - the **category axis** goes to the right, so the stage names stay on the
 *    side the reader starts from;
 *  - the **value axis is reversed**, so zero sits against that axis and the
 *    bars grow away from their own labels rather than toward them from the far
 *    edge — this is the one that was missing, and it left every bar anchored on
 *    the opposite side of the card from the name that identifies it;
 *  - the **value label** moves to the bar's new end, and the margin that
 *    reserves room for it swaps with it, or the number is clipped by the plot
 *    edge.
 *
 * ⚠️ **The SVG is pinned to `direction: ltr`, and the chart breaks without it.**
 * `text-anchor: start` resolves against the inline base direction, so under RTL
 * Recharts anchors a right-hand axis tick at its *right* edge and the label
 * grows leftward — out of the strip reserved for it and straight across the
 * bars. The mirroring above is geometry (`orientation`, `reversed`,
 * `position`), not text direction, so the SVG does not need RTL to be correct.
 * Scoped to `svg` alone: the tooltip is an HTML div and still reads
 * right-to-left.
 */
function stageLabel(key: string, locale: Locale): string {
  const labels = t(ACTIVATION, locale)
  const map: Record<string, string> = {
    signedUp: labels.stageSignedUp,
    identityVerified: labels.stageIdentityVerified,
    vaultCreated: labels.stageVaultCreated,
    sheetPrinted: labels.stageSheetPrinted,
    heirNamed: labels.stageHeirNamed,
    deliveryPrepared: labels.stageDeliveryPrepared,
    checkinConfigured: labels.stageCheckinConfigured,
  }
  return map[key] ?? key
}

export function ActivationFunnel() {
  const locale = useLocale()
  const labels = t(ACTIVATION, locale)
  const activation = useQuery(api.admin.activation)
  const rtl = locale === "ar"

  const config = {
    count: { label: labels.funnelTitle, color: "var(--chart-1)" },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">
          {labels.funnelTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {activation === undefined ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <ChartContainer config={config} className="h-72 w-full [&_svg]:[direction:ltr]">
            <BarChart
              accessibilityLayer
              layout="vertical"
              data={activation.stages.map((stage) => ({
                stage: stageLabel(stage.key, locale),
                count: stage.count,
              }))}
              margin={rtl ? { left: 32, right: 8 } : { left: 8, right: 32 }}
            >
              <XAxis type="number" dataKey="count" reversed={rtl} hide />
              <YAxis
                type="category"
                dataKey="stage"
                tickLine={false}
                axisLine={false}
                width={128}
                tick={{ fontSize: 12 }}
                orientation={rtl ? "right" : "left"}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={4}>
                {/* Direct labels, so the numbers are readable without hovering
                    and the chart still means something in print or greyscale. */}
                <LabelList
                  dataKey="count"
                  content={barValueLabel(rtl, (value) =>
                    fmtNumber(value, locale)
                  )}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
