"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { CLAIMS } from "@/features/claims/strings/claims"
import { t, type Locale } from "@/lib/i18n/locale"

/**
 * Who this report would deliver to. Read-only: on release every executor gets
 * their own delivery and proves their own identity, so there is nothing to act
 * on here — only the fact a reviewer should weigh, which is whether anyone
 * could open what is handed over.
 */
export function ClaimExecutors({
  executors,
  locale,
}: {
  executors: readonly { id: string; name: string; hasSheet: boolean }[]
  locale: Locale
}) {
  const labels = t(CLAIMS, locale)
  const anyWithoutSheet = executors.some((executor) => !executor.hasSheet)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">
          {labels.executorTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">{labels.executorHint}</p>
        {executors.length === 0 ? (
          <p className="text-sm text-muted-foreground">{labels.executorNone}</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {executors.map((executor) => (
              <li
                key={executor.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="font-medium">{executor.name}</span>
                {executor.hasSheet ? (
                  <span className="text-muted-foreground">
                    {labels.executorSheet}
                  </span>
                ) : (
                  <span className="text-destructive">
                    {labels.executorNoSheet}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {anyWithoutSheet && (
          <p className="text-xs text-muted-foreground">
            {labels.executorNoSheetNote}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
