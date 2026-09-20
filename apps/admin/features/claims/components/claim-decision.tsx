"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import type { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import type { FunctionReturnType } from "convex/server"
import {
  ArrowUpRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  TriangleAlertIcon,
  XCircleIcon,
} from "lucide-react"

import { IdentityBadge } from "@/components/identity-badge"
import { ClaimVerdict } from "@/features/claims/components/claim-verdict"
import { CLAIMS } from "@/features/claims/strings/claims"
import { fmtDate, fmtNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

type Detail = NonNullable<FunctionReturnType<typeof api.admin.claimDetail>>
type Labels = ReturnType<typeof t<typeof CLAIMS>>

/**
 * Everything the decision rests on, and the decision — nothing else.
 *
 * Three labelled blocks, top down: the two names (the judgement), who filed,
 * and where the claim stands. Nothing is pushed to the bottom of the card —
 * a verdict floating below a band of empty space reads as a different screen
 * from the facts it belongs to.
 */
export function ClaimDecision({ detail, locale }: { detail: Detail; locale: Locale }) {
  const labels = t(CLAIMS, locale)
  const { claim, subject, priorClaims, blocked, deliveries } = detail
  const vetoedBefore = priorClaims.some((row) => row.status === "vetoed")
  const staleIdentity = detail.storedIdentityStatus !== detail.liveIdentityStatus

  return (
    <Card className="flex h-full flex-col gap-0 py-0">
      <CardContent className="flex flex-col gap-0 divide-y p-0">
        <Block title={labels.comparisonTitle}>
          <Name
            label={labels.certificateNameLabel}
            value={claim.certificateName ?? labels.certificateNone}
          />
          <Name label={labels.ownerNameLabel} value={subject.verifiedName ?? labels.ownerNameNone} />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {labels.comparisonHint}
          </p>
        </Block>

        <Block title={labels.claimantLabel}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-base font-medium">{claim.claimantName}</span>
            <IdentityBadge status={detail.liveIdentityStatus} locale={locale} />
          </div>
          <span dir="ltr" className="self-start text-sm text-muted-foreground">
            {claim.claimantContact}
          </span>
          {staleIdentity && (
            <span className="text-xs text-muted-foreground">
              {labels.identityStaleWarning.replace("{stored}", detail.storedIdentityStatus)}
            </span>
          )}
          {vetoedBefore && (
            <p className="flex gap-2 text-sm leading-relaxed text-destructive">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
              {labels.priorWarning}
            </p>
          )}
        </Block>

        <Block title={labels.decisionTitle} className="flex-1">
          {claim.status === "submitted" ? (
            <ClaimVerdict claimId={claim.id} blocked={blocked} locale={locale} />
          ) : claim.status === "awaiting_veto" ? (
            <State
              tone="waiting"
              icon={ClockIcon}
              text={labels.stateAwaiting.replace(
                "{date}",
                claim.vetoDeadline === null ? "—" : fmtDate(claim.vetoDeadline, locale)
              )}
            />
          ) : claim.status === "released" ? (
            <Released detail={detail} deliveries={deliveries} labels={labels} locale={locale} />
          ) : (
            <State tone="ended" icon={XCircleIcon} text={labels.stateClosed} />
          )}
        </Block>
      </CardContent>
    </Card>
  )
}

/** One labelled section. The eyebrow is the only heading level in the panel. */
function Block({
  title,
  className,
  children,
}: {
  title: string
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn("flex flex-col gap-2 p-5", className)}>
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Name({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-heading text-lg leading-snug">{value}</span>
    </div>
  )
}

/** Where the claim stands, when there is nothing left to decide. */
function State({
  tone,
  icon: Icon,
  text,
}: {
  tone: "waiting" | "done" | "ended"
  icon: typeof ClockIcon
  text: string
}) {
  return (
    <p className="flex items-start gap-2 text-sm leading-relaxed">
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "done" && "text-secondary",
          tone === "ended" && "text-muted-foreground",
          tone === "waiting" && "text-primary"
        )}
      />
      <span className={cn(tone === "ended" && "text-muted-foreground")}>{text}</span>
    </p>
  )
}

function Released({
  detail,
  deliveries,
  labels,
  locale,
}: {
  detail: Detail
  deliveries: Detail["deliveries"]
  labels: Labels
  locale: Locale
}) {
  const ready = deliveries.filter((row) => row.status === "ready").length
  return (
    <div className="flex flex-col gap-3">
      <State
        tone="done"
        icon={CheckCircle2Icon}
        text={labels.stateReleased.replace(
          "{date}",
          detail.claim.releasedAt === null ? "—" : fmtDate(detail.claim.releasedAt, locale)
        )}
      />
      {deliveries.length === 0 ? (
        <p className="text-sm text-destructive">{labels.deliveriesNone}</p>
      ) : (
        <>
          <p className="text-sm">
            {labels.deliveriesSummary
              .replace("{ready}", fmtNumber(ready, locale))
              .replace("{total}", fmtNumber(deliveries.length, locale))}
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/deliveries?claim=${detail.claim.id}`}>
              {labels.deliveriesOpen}
              <ArrowUpRightIcon className="rtl:-scale-x-100" />
            </Link>
          </Button>
        </>
      )}
    </div>
  )
}
