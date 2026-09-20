"use client"

import Link from "next/link"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { useQuery } from "convex/react"
import { ArrowRightIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { RecordNotFound } from "@/components/record-not-found"
import { ClaimCertificate } from "@/features/claims/components/claim-certificate"
import { ClaimDecision } from "@/features/claims/components/claim-decision"
import { ClaimHeirs } from "@/features/claims/components/claim-heirs"
import { ClaimHistory } from "@/features/claims/components/claim-history"
import {
  claimStatusLabel,
  type ClaimStatus,
} from "@/features/claims/lib/status"
import { CLAIMS } from "@/features/claims/strings/claims"
import { fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"

/**
 * One claim, where an irreversible decision gets made.
 *
 * The certificate and the decision sit side by side, because the decision is a
 * judgement *about* the certificate and the reviewer should never have to
 * scroll between them. Everything else — the heirs, the history — is one tab
 * away rather than stacked on the page.
 *
 * The buttons disable on `detail.blocked`, which the server computes with the
 * same `nameMatchBlockedReason` the mutation throws on — one predicate, so a
 * button can never look available for something the server will refuse.
 */
export function ClaimReview({ claimId }: { claimId: string }) {
  const locale = useLocale()
  const labels = t(CLAIMS, locale)
  // No cast: the server normalises the raw path segment, so a malformed id and
  // a claim that is gone come back the same way rather than throwing.
  const detail = useQuery(api.admin.claimDetail, { claimId })

  if (detail === undefined) {
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Skeleton className="h-[72vh] rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }
  if (detail === null) {
    return (
      <RecordNotFound id={claimId} backHref="/claims" backLabel={labels.back} />
    )
  }

  const { claim, heirs, history } = detail

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/claims">
            {/* `ltr:`, not `rtl:`: back is leftward in LTR and rightward in
                RTL, so an arrow that points right turns only in LTR. */}
            <ArrowRightIcon className="ltr:rotate-180" />
            {labels.back}
          </Link>
        </Button>
        <Badge variant="outline">
          {claimStatusLabel(claim.status as ClaimStatus, locale)}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {fmtDate(claim.submittedAt, locale)}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <ClaimCertificate
          url={claim.certificateUrl}
          contentType={claim.certificateContentType}
          locale={locale}
        />
        <ClaimDecision detail={detail} locale={locale} />
      </div>

      <Tabs defaultValue="heirs" className="gap-4">
        <TabsList>
          <TabsTrigger value="heirs">{labels.tabHeirs}</TabsTrigger>
          <TabsTrigger value="history">{labels.tabHistory}</TabsTrigger>
        </TabsList>
        <TabsContent value="heirs">
          <ClaimHeirs heirs={heirs} locale={locale} />
        </TabsContent>
        <TabsContent value="history">
          <ClaimHistory history={history} locale={locale} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
