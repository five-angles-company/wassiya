"use client"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { CLAIMS } from "@/features/claims/strings/claims"
import { fmtNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

/**
 * Who this report would deliver to. Read-only: on release every heir with a
 * built bundle gets their own delivery and proves their own identity, so there
 * is nothing to link here — only the fact a reviewer should weigh, which is
 * whether anyone would receive anything at all.
 */
export function ClaimHeirs({
  heirs,
  locale,
}: {
  heirs: readonly {
    id: string
    name: string
    relation: string
    routedAssetCount: number
  }[]
  locale: Locale
}) {
  const labels = t(CLAIMS, locale)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">
          {labels.heirTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">{labels.heirHint}</p>
        {heirs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{labels.heirNone}</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {heirs.map((heir) => (
              <li
                key={heir.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium">{heir.name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {heir.relation}
                  </span>
                </span>
                <Badge
                  variant={
                    heir.routedAssetCount === 0 ? "outline" : "secondary"
                  }
                >
                  {labels.heirAssets.replace(
                    "{n}",
                    fmtNumber(heir.routedAssetCount, locale)
                  )}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
