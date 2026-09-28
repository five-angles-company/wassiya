"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ArrowUpRightIcon } from "lucide-react"

import { ClaimIdentity } from "@/features/claims/components/claim-identity"
import { ClaimMore } from "@/features/claims/components/claim-more"
import { ClaimRuling } from "@/features/claims/components/claim-ruling"
import { ClaimCompare } from "@/features/claims/components/claim-compare"
import type { ClaimDetail } from "@/features/claims/lib/detail"
import { CLAIMS } from "@/features/claims/strings/claims"
import { usePermissions } from "@/hooks/use-permissions"
import { t, type Locale } from "@/lib/i18n/locale"

/**
 * The column beside the certificate: the review steps while a report waits,
 * the ruling once it is decided. Without `claims.rule` a waiting report shows
 * the identity it will be judged against and no steps — the mutations are the
 * real gate.
 */
export function ClaimPanel({
  detail,
  locale,
}: {
  detail: ClaimDetail
  locale: Locale
}) {
  const labels = t(CLAIMS, locale)
  const { has, loading } = usePermissions()
  const { claim, subject } = detail

  return (
    <Card className="flex flex-col gap-0 overflow-hidden rounded-[18px] py-0 lg:min-h-0">
      {claim.status !== "submitted" ? (
        <ClaimRuling detail={detail} locale={locale} />
      ) : subject.id === null ? (
        <Plain title={labels.unmatchedTitle}>
          <p className="text-base leading-relaxed text-muted-foreground">
            {labels.sitUnmatched}
          </p>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-2xl text-base font-semibold"
          >
            <Link href="/unmatched">
              {labels.unmatchedOpen}
              <ArrowUpRightIcon className="rtl:-scale-x-100" />
            </Link>
          </Button>
          <ClaimMore detail={detail} locale={locale} />
        </Plain>
      ) : loading ? (
        <Skeleton className="m-8 h-64 rounded-2xl" />
      ) : has("claims.rule") ? (
        // Keyed so moving to another report starts its comparison afresh.
        <ClaimCompare key={claim.id} detail={detail} locale={locale} />
      ) : (
        <Plain title={labels.awaitingTitle}>
          <ClaimIdentity subject={subject} locale={locale} />
          <ClaimMore detail={detail} locale={locale} />
        </Plain>
      )}
    </Card>
  )
}

function Plain({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-8">
      <h2 className="font-heading text-[28px] leading-snug font-extrabold">
        {title}
      </h2>
      {children}
    </div>
  )
}
