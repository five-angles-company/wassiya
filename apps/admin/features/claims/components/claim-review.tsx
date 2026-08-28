"use client"

import Link from "next/link"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"
import {
  ArrowRightIcon,
  ExternalLinkIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { ClaimVerdict } from "@/features/claims/components/claim-verdict"
import { ClaimHeirLink } from "@/features/claims/components/claim-heir-link"
import { ClaimHistory } from "@/features/claims/components/claim-history"
import { IdentityBadge } from "@/components/identity-badge"
import {
  claimStatusLabel,
  type ClaimStatus,
} from "@/features/claims/lib/status"
import { CLAIMS } from "@/features/claims/strings/claims"
import { t } from "@/lib/i18n/locale"
import { fmtDate } from "@/lib/format"

/**
 * The screen where an irreversible decision gets made.
 *
 * Built so that everything the decision rests on is on screen *before* the
 * action is offered: the two names side by side, the certificate, the claimant's
 * live identity state, and whether this person has filed before.
 *
 * The buttons disable on `detail.blocked`, which the server computes with the
 * same `nameMatchBlockedReason` the mutation throws on — one predicate, so a
 * button can never look available for something the server will refuse.
 */
export function ClaimReview({ claimId }: { claimId: string }) {
  const locale = useLocale()
  const labels = t(CLAIMS, locale)
  const detail = useQuery(api.admin.claimDetail, {
    claimId: claimId as Id<"claims">,
  })

  if (detail === undefined)
    return <Skeleton className="h-96 w-full rounded-xl" />
  if (detail === null) {
    return <p className="text-muted-foreground">{labels.empty}</p>
  }

  const { claim, subject, heirs, priorClaims, history, blocked } = detail
  const vetoedBefore = priorClaims.some((row) => row.status === "vetoed")


  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/claims">
            {/* `ltr:`, not `rtl:`. Back is leftward in a left-to-right page and
                rightward in a right-to-left one, so an arrow that already
                points right needs turning in LTR and leaving alone in RTL.
                Reversed, it pointed *forward* in both. */}
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

      {/* The judgement, and nothing else, at the top of the screen. */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">
            {labels.comparisonTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                {labels.certificateNameLabel}
              </span>
              <span className="font-heading text-xl">
                {claim.certificateName ?? labels.certificateNone}
              </span>
              {claim.certificateUrl !== null && (
                <a
                  href={claim.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLinkIcon className="size-3.5" />
                  {labels.certificateView}
                </a>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                {labels.ownerNameLabel}
              </span>
              <span className="font-heading text-xl">
                {subject.verifiedName ?? labels.ownerNameNone}
              </span>
            </div>
          </div>

          <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
            {labels.comparisonHint}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Claimant + live identity. */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">
              {labels.claimantLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="font-medium">{claim.claimantName}</span>
              <span
                dir="ltr"
                className="inline-block text-sm text-muted-foreground"
              >
                {claim.claimantContact}
              </span>
            </div>
            <div className="flex items-center gap-2 border-t pt-3">
              <span className="text-xs text-muted-foreground">
                {labels.identityLive}
              </span>
              <IdentityBadge
                status={detail.liveIdentityStatus}
                locale={locale}
              />
            </div>
            {/* A snapshot that disagrees with the live value is exactly the case
                the guard exists for, so it is shown rather than hidden. */}
            {detail.storedIdentityStatus !== detail.liveIdentityStatus && (
              <p className="text-xs text-muted-foreground">
                {labels.identityStaleWarning.replace(
                  "{stored}",
                  detail.storedIdentityStatus
                )}
              </p>
            )}
          </CardContent>
        </Card>

        <ClaimHeirLink
          claimId={claim.id}
          linkedHeirId={claim.heirId}
          heirs={heirs}
          locale={locale}
        />
      </div>

      {/* A prior veto the backend's contact-string lockout may have missed. */}
      {vetoedBefore && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <TriangleAlertIcon className="size-4" />
              {labels.priorTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm leading-relaxed">{labels.priorWarning}</p>
            {priorClaims.map((row) => (
              <div key={row.id} className="text-sm text-muted-foreground">
                {claimStatusLabel(row.status as ClaimStatus, locale)} ·{" "}
                {fmtDate(row.submittedAt, locale)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <ClaimVerdict claimId={claim.id} blocked={blocked} locale={locale} />

      <ClaimHistory history={history} locale={locale} />
    </div>
  )
}
