"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useMutation, useQuery } from "convex/react"
import {
  ArrowRightIcon,
  ExternalLinkIcon,
  InfoIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { useLocale } from "@/components/locale-provider"
import { ConfirmAction } from "@/features/claims/components/confirm-action"
import { IdentityBadge } from "@/features/claims/components/identity-badge"
import {
  claimStatusLabel,
  type ClaimStatus,
} from "@/features/claims/lib/status"
import { CLAIMS } from "@/features/claims/strings/claims"
import { t } from "@/lib/i18n/locale"
import { fmtDate, fmtNumber } from "@/lib/format"

/** The three refusal reasons, in the operator's language. */
function blockedLabel(
  reason: string | null,
  labels: ReturnType<typeof t<typeof CLAIMS>>
): string | undefined {
  if (reason === "no-heir") return labels.blockedNoHeir
  if (reason === "identity-not-verified") return labels.blockedIdentity
  if (reason === "past-review") return labels.blockedPastReview
  return undefined
}

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

  const setNameMatch = useMutation(api.claims.adminSetNameMatch)
  const linkHeir = useMutation(api.claims.adminLinkHeir)
  const [chosenHeir, setChosenHeir] = useState<string>("")

  if (detail === undefined)
    return <Skeleton className="h-96 w-full rounded-xl" />
  if (detail === null) {
    return <p className="text-muted-foreground">{labels.empty}</p>
  }

  const { claim, subject, heirs, priorClaims, history, blocked } = detail
  const vetoedBefore = priorClaims.some((row) => row.status === "vetoed")

  async function act(run: () => Promise<unknown>, success: string) {
    try {
      await run()
      toast.success(success)
    } catch (error) {
      // The server's message is the useful one — it names which precondition
      // failed — so it is shown rather than replaced with a generic apology.
      toast.error(error instanceof Error ? error.message : labels.toastFailed)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/claims">
            <ArrowRightIcon className="rtl:rotate-180" />
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

        {/* The heir picker. */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">
              {labels.heirTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {heirs.length === 0 ? (
              <p className="text-sm text-muted-foreground">{labels.heirNone}</p>
            ) : (
              <>
                <Select
                  value={chosenHeir || (claim.heirId ?? "")}
                  onValueChange={setChosenHeir}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={labels.heirPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {heirs.map((heir) => (
                      <SelectItem key={heir.id} value={heir.id}>
                        {heir.name} · {heir.relation} ·{" "}
                        {labels.heirAssets.replace(
                          "{n}",
                          fmtNumber(heir.routedAssetCount, locale)
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ConfirmAction
                  tone="neutral"
                  title={labels.linkDialogTitle}
                  body={labels.linkDialogBody}
                  confirmLabel={labels.linkConfirm}
                  cancelLabel={labels.cancel}
                  onConfirm={() =>
                    act(
                      () =>
                        linkHeir({
                          claimId: claim.id,
                          heirId: (chosenHeir || claim.heirId) as Id<"heirs">,
                        }),
                      labels.toastLinked
                    )
                  }
                  trigger={
                    <Button
                      size="sm"
                      className="self-start"
                      disabled={
                        (chosenHeir || claim.heirId) === null ||
                        (chosenHeir || claim.heirId) === ""
                      }
                    >
                      {labels.linkHeir}
                    </Button>
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {labels.heirHint}
                </p>
              </>
            )}
          </CardContent>
        </Card>
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

      {/* The verdict. */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">
            {labels.verdictTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <ConfirmAction
              tone="neutral"
              title={labels.approveDialogTitle}
              body={labels.approveDialogBody}
              confirmLabel={labels.approveConfirm}
              cancelLabel={labels.cancel}
              onConfirm={() =>
                act(
                  () => setNameMatch({ claimId: claim.id, nameMatch: true }),
                  labels.toastApproved
                )
              }
              trigger={
                <Button disabled={blocked.approve !== null}>
                  {labels.approve}
                </Button>
              }
            />
            <ConfirmAction
              tone="destructive"
              title={labels.rejectDialogTitle}
              body={labels.rejectDialogBody}
              confirmLabel={labels.rejectConfirm}
              cancelLabel={labels.cancel}
              onConfirm={() =>
                act(
                  () => setNameMatch({ claimId: claim.id, nameMatch: false }),
                  labels.toastRejected
                )
              }
              trigger={
                <Button
                  variant="destructive"
                  disabled={blocked.reject !== null}
                >
                  {labels.reject}
                </Button>
              }
            />
          </div>

          {blockedLabel(blocked.approve, labels) !== undefined && (
            <p className="text-sm text-muted-foreground">
              {blockedLabel(blocked.approve, labels)}
            </p>
          )}

          {/* The dead end, named on the screen rather than discovered later. */}
          <div className="flex gap-2 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
            <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
            <span>
              <span className="font-medium">{labels.guardianGapTitle}. </span>
              {labels.guardianGapBody}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* What has already happened. */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">
            {labels.historyTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {labels.historyEmpty}
            </p>
          ) : (
            history.map((row, index) => (
              <div
                key={`${row.event}-${index}`}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span dir="ltr" className="inline-block font-mono text-xs">
                  {row.event}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {fmtDate(row.at, locale)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
