"use client"

import { ClaimFact } from "@/features/claims/components/claim-fact"
import type { ClaimDetail } from "@/features/claims/lib/detail"
import { CLAIMS } from "@/features/claims/strings/claims"
import { t, type Locale } from "@/lib/i18n/locale"

/**
 * Who this report would deliver to. Read-only: each executor proves their own
 * identity on release, so the only fact to weigh here is whether anyone could
 * open what is handed over.
 */
export function ClaimExecutors({
  executors,
  locale,
}: {
  executors: ClaimDetail["executors"]
  locale: Locale
}) {
  const labels = t(CLAIMS, locale)
  const anyWithoutSheet = executors.some((executor) => !executor.hasSheet)

  return (
    <ClaimFact label={labels.executorTitle}>
      {executors.length === 0 ? (
        <span className="text-destructive">{labels.executorNone}</span>
      ) : (
        executors.map((executor) => (
          <span key={executor.id}>
            <bdi className="font-medium">{executor.name}</bdi>
            <span
              className={
                executor.hasSheet ? "text-muted-foreground" : "text-destructive"
              }
            >
              {" · "}
              {executor.hasSheet
                ? labels.executorSheet
                : labels.executorNoSheet}
            </span>
          </span>
        ))
      )}
      {anyWithoutSheet && (
        <span className="mt-1 text-xs text-muted-foreground">
          {labels.executorNoSheetNote}
        </span>
      )}
    </ClaimFact>
  )
}
