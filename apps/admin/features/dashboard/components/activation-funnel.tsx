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
 */
function stageLabel(key: string, locale: Locale): string {
  const labels = t(ACTIVATION, locale)
  const map: Record<string, string> = {
    signedUp: labels.stageSignedUp,
    identityVerified: labels.stageIdentityVerified,
    vaultCreated: labels.stageVaultCreated,
    sheetPrinted: labels.stageSheetPrinted,
    heirNamed: labels.stageHeirNamed,
    guardianLive: labels.stageGuardianLive,
    checkinConfigured: labels.stageCheckinConfigured,
  }
  return map[key] ?? key
}

export function ActivationFunnel() {
  const locale = useLocale()
  const labels = t(ACTIVATION, locale)
  const activation = useQuery(api.admin.activation)

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
          <ChartContainer config={config} className="h-72 w-full">
            <BarChart
              accessibilityLayer
              layout="vertical"
              data={activation.stages.map((stage) => ({
                stage: stageLabel(stage.key, locale),
                count: stage.count,
              }))}
              margin={{ left: 8, right: 32 }}
            >
              <XAxis type="number" dataKey="count" hide />
              <YAxis
                type="category"
                dataKey="stage"
                tickLine={false}
                axisLine={false}
                width={128}
                tick={{ fontSize: 12 }}
                // Recharts positions the category axis physically. Under RTL
                // the chart mirrors as a whole, so the axis has to be told to
                // sit on the other side or it overlaps the bars.
                orientation={locale === "ar" ? "right" : "left"}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={4}>
                {/* Direct labels, so the numbers are readable without hovering
                    and the chart still means something in print or greyscale. */}
                <LabelList
                  dataKey="count"
                  position="right"
                  className="fill-foreground"
                  fontSize={12}
                  formatter={(value) => fmtNumber(Number(value ?? 0), locale)}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
