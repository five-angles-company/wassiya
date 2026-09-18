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
import { t } from "@/lib/i18n/locale"
import { barValueLabel } from "@/features/dashboard/components/bar-value-label"
import { STORAGE } from "@/features/dashboard/strings/storage"
import { fmtBytes } from "@/lib/format"

const TYPE_KEYS = [
  "crypto",
  "bank",
  "document",
  "photos",
  "digital",
  "note",
] as const

const TYPE_LABEL: Record<
  (typeof TYPE_KEYS)[number],
  { ar: string; en: string }
> = {
  crypto: { ar: "عملات رقمية", en: "Crypto" },
  bank: { ar: "حسابات بنكية", en: "Bank" },
  document: { ar: "مستندات", en: "Documents" },
  photos: { ar: "صور", en: "Photos" },
  digital: { ar: "حسابات رقمية", en: "Digital" },
  note: { ar: "ملاحظات", en: "Notes" },
}

/**
 * Storage by asset type, ranked, with the one caveat that has to stay on screen.
 *
 * **Magnitude, not identity**: one hue, bars ordered largest first, each
 * directly labelled. Six categories would need six distinguishable colours, and
 * this palette provably cannot supply two — terracotta against olive measures
 * ΔE 5.2 under deuteranopia.
 *
 * The billing line survived the cull because deleting it would be dishonest:
 * nothing in this deployment writes a plan or a renewal date, so an empty
 * revenue figure means "nobody has been asked to pay", not "nobody is paying".
 * One sentence is the smallest form of that statement that is still true.
 */
export function StoragePanel() {
  const locale = useLocale()
  // Mirrored as one piece under RTL — see `activation-funnel.tsx` for why the
  // value axis has to reverse along with the category one.
  const rtl = locale === "ar"
  const labels = t(STORAGE, locale)
  const storage = useQuery(api.admin.storage, {})

  const config = {
    bytes: { label: labels.byTypeTitle, color: "var(--chart-1)" },
  } satisfies ChartConfig

  if (storage === undefined) {
    return <Skeleton className="h-72 w-full rounded-xl" />
  }

  const chartData = TYPE_KEYS.map((key) => ({
    type: TYPE_LABEL[key][locale],
    bytes: storage.byType[key].bytes,
    count: storage.byType[key].count,
  }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.bytes - a.bytes)

  return (
    <Card>
      <CardHeader className="flex-row items-baseline justify-between gap-3">
        <CardTitle className="font-heading text-base">
          {labels.byTypeTitle}
        </CardTitle>
        <span className="text-sm text-muted-foreground tabular-nums">
          {fmtBytes(storage.totalBytes, locale)}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {chartData.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            {labels.topEmpty}
          </div>
        ) : (
          <ChartContainer config={config} className="h-56 w-full [&_svg]:[direction:ltr]">
            <BarChart
              accessibilityLayer
              layout="vertical"
              data={chartData}
              margin={rtl ? { left: 56, right: 8 } : { left: 8, right: 56 }}
            >
              <XAxis type="number" dataKey="bytes" reversed={rtl} hide />
              <YAxis
                type="category"
                dataKey="type"
                tickLine={false}
                axisLine={false}
                width={104}
                tick={{ fontSize: 12 }}
                orientation={rtl ? "right" : "left"}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="bytes" fill="var(--color-bytes)" radius={4}>
                <LabelList
                  dataKey="bytes"
                  content={barValueLabel(rtl, (value) =>
                    fmtBytes(value, locale)
                  )}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}

        {storage.billingUnwired && (
          <p className="border-t pt-3 text-xs text-muted-foreground">
            {labels.billingShort}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
