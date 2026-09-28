"use client"

import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"

import { useLocale } from "@/components/locale-provider"
import { RecordNotFound } from "@/components/record-not-found"
import { ClaimCertificate } from "@/features/claims/components/claim-certificate"
import { ClaimHeader } from "@/features/claims/components/claim-header"
import { ClaimPanel } from "@/features/claims/components/claim-panel"
import { CLAIMS } from "@/features/claims/strings/claims"
import { t } from "@/lib/i18n/locale"

/**
 * One death report: the certificate, and beside it the comparison with the
 * owner's verified identity while it waits, the ruling once decided. On a wide
 * screen the page is exactly the viewport, so the document and the comparison
 * are always on screen together.
 */
export function ClaimReview({ claimId }: { claimId: string }) {
  const locale = useLocale()
  const labels = t(CLAIMS, locale)
  // The server normalises the raw path segment, so a malformed id and a
  // report that is gone both come back as `null`.
  const detail = useQuery(api.admin.claimDetail, { claimId })

  if (detail === undefined) {
    return (
      <div className="flex flex-col gap-6 lg:h-full lg:min-h-0">
        <Skeleton className="h-20 rounded-xl" />
        <div className="grid gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_500px]">
          <Skeleton className="h-[70svh] rounded-xl lg:h-full" />
          <Skeleton className="h-96 rounded-xl lg:h-full" />
        </div>
      </div>
    )
  }
  if (detail === null) {
    return (
      <RecordNotFound id={claimId} backHref="/claims" backLabel={labels.back} />
    )
  }

  const { claim } = detail

  return (
    <div className="flex flex-col gap-6 lg:h-full lg:min-h-0">
      <ClaimHeader detail={detail} locale={locale} />

      <div className="grid gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_500px] lg:grid-rows-[minmax(0,1fr)]">
        <ClaimCertificate
          url={claim.certificateUrl}
          contentType={claim.certificateContentType}
          locale={locale}
          className="h-[70svh] rounded-[18px] lg:h-full"
        />
        <ClaimPanel detail={detail} locale={locale} />
      </div>
    </div>
  )
}
