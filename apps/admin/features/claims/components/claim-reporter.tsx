"use client"

import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { CopyIcon, TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"

import { ClaimFact } from "@/features/claims/components/claim-fact"
import type { ClaimDetail } from "@/features/claims/lib/detail"
import {
  claimStatusLabel,
  type ClaimStatus,
} from "@/features/claims/lib/status"
import { CLAIMS } from "@/features/claims/strings/claims"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

/** Who filed, how to reach them, and what else they have filed on this vault. */
export function ClaimReporter({
  detail,
  locale,
}: {
  detail: ClaimDetail
  locale: Locale
}) {
  const labels = t(CLAIMS, locale)
  const { claim, priorClaims } = detail
  const warn =
    claim.status === "submitted" &&
    priorClaims.some((row) => row.status === "vetoed")

  return (
    <>
      <ClaimFact label={labels.reporterTitle}>
        <span className="font-medium">
          <bdi>{claim.claimantName}</bdi>
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <bdi>{claim.claimantContact}</bdi>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={labels.actionCopyContact}
            onClick={() => {
              void navigator.clipboard.writeText(claim.claimantContact)
              toast.success(labels.copied)
            }}
          >
            <CopyIcon />
          </Button>
        </span>
      </ClaimFact>

      {priorClaims.length > 0 && (
        <ClaimFact label={labels.priorTitle}>
          {priorClaims.map((row) => (
            <Link
              key={row.id}
              href={`/claims/${row.id}`}
              className="self-start hover:underline"
            >
              {claimStatusLabel(row.status as ClaimStatus, locale)}
              <span className="text-muted-foreground">
                {" · "}
                {fmtDate(row.submittedAt, locale)}
              </span>
            </Link>
          ))}
          {warn && (
            <span className="mt-1 flex gap-1.5 text-destructive">
              <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
              {labels.priorWarning}
            </span>
          )}
        </ClaimFact>
      )}
    </>
  )
}
