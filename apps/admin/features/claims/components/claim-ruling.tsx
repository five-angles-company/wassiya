"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  ArrowUpRightIcon,
  CheckIcon,
  ClockIcon,
  HeartPulseIcon,
  MinusIcon,
  XIcon,
} from "lucide-react"

import { ClaimMore } from "@/features/claims/components/claim-more"
import { fmtBirthDate } from "@/features/claims/lib/birth-date"
import type { ClaimDetail } from "@/features/claims/lib/detail"
import {
  claimStatusLabel,
  rejectReasonLabel,
} from "@/features/claims/lib/status"
import { CLAIMS } from "@/features/claims/strings/claims"
import { fmtDate, fmtNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

type Tone = "settled" | "waiting" | "refused" | "plain"

const TONE: Record<Tone, string> = {
  settled: "bg-secondary/15 text-secondary",
  waiting: "bg-accent text-primary",
  refused: "bg-accent text-destructive",
  plain: "bg-muted text-muted-foreground",
}

/**
 * A report past review, in the compare table's shape: what happened as the
 * title, then only the facts that apply to this ending. The owner's identity
 * appears only when someone actually ruled against it.
 */
export function ClaimRuling({
  detail,
  locale,
}: {
  detail: ClaimDetail
  locale: Locale
}) {
  const labels = t(CLAIMS, locale)
  const { claim, subject, deliveries } = detail
  const on = (at: number | null) => (at === null ? "—" : fmtDate(at, locale))
  const by = claim.reviewedBy ?? labels.rulingSomeone
  const ruled = claim.nameMatch !== null

  const head = headOf(detail, locale)
  const ready = deliveries.filter((row) => row.status === "ready").length

  // An ending nobody ruled on has one sentence to say; it sits in the middle
  // of the panel rather than above a column of empty space.
  if (
    !ruled &&
    claim.status !== "released" &&
    claim.status !== "awaiting_veto"
  ) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-8 text-center">
        <span
          className={cn(
            "flex size-14 items-center justify-center rounded-2xl",
            TONE[head.tone]
          )}
        >
          <head.icon className="size-6" strokeWidth={2.4} />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-2xl leading-snug font-extrabold">
            {head.title}
          </h2>
          <p className="text-sm text-muted-foreground">{head.sub}</p>
          {claim.status === "vetoed" && claim.lockedUntil !== null && (
            <p className="text-sm text-muted-foreground">
              {labels.rowBarredUntil} {on(claim.lockedUntil)}
            </p>
          )}
        </div>
        <ClaimMore detail={detail} locale={locale} centered />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-7 pt-6 pb-2">
        <div className="flex items-start gap-3.5">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl",
              TONE[head.tone]
            )}
          >
            <head.icon className="size-5" strokeWidth={2.4} />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="font-heading text-[21px] leading-snug font-extrabold">
              {head.title}
            </h2>
            <p className="text-sm text-muted-foreground">{head.sub}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-col divide-y">
          {ruled && (
            <Row label={labels.rowRuling}>
              <bdi>
                {(claim.nameMatch
                  ? labels.rowApprovedBy
                  : labels.rowRejectedBy
                ).replace("{name}", by)}
              </bdi>
              <Muted>{on(claim.reviewedAt)}</Muted>
            </Row>
          )}
          {claim.rejectReason !== null && (
            <Row label={labels.rowReason} tone="text-destructive">
              {rejectReasonLabel(claim.rejectReason, locale)}
            </Row>
          )}
          {ruled && subject.verifiedName !== null && (
            <Row label={labels.nameLabel}>
              <bdi>{subject.verifiedName}</bdi>
            </Row>
          )}
          {ruled && subject.birthDate !== null && (
            <Row label={labels.birthDateLabel}>
              {fmtBirthDate(subject.birthDate, locale)}
            </Row>
          )}
          {ruled && subject.hasIdNumbers && (
            <Row
              label={labels.idLabel}
              tone={
                claim.idCheck.matched === true
                  ? "text-secondary"
                  : claim.idCheck.matched === false
                    ? "text-destructive"
                    : "text-muted-foreground"
              }
            >
              {claim.idCheck.matched === true
                ? labels.idLineMatched
                : claim.idCheck.matched === false
                  ? labels.idLineMissed
                  : labels.idLineUnchecked}
            </Row>
          )}
          {claim.status === "released" && (
            <Row
              label={labels.executorTitle}
              tone={deliveries.length === 0 ? "text-destructive" : undefined}
            >
              {deliveries.length === 0
                ? labels.deliveriesNone
                : labels.deliveriesSummary
                    .replace("{ready}", fmtNumber(ready, locale))
                    .replace("{total}", fmtNumber(deliveries.length, locale))}
            </Row>
          )}
          {claim.status === "vetoed" && claim.lockedUntil !== null && (
            <Row label={labels.rowBarredUntil}>{on(claim.lockedUntil)}</Row>
          )}
          <ClaimMore detail={detail} locale={locale} />
        </div>
      </div>

      {claim.status === "released" && deliveries.length > 0 && (
        <div className="border-t px-7 pt-4 pb-6">
          <Button
            asChild
            variant="ghost"
            className="h-[52px] w-full rounded-2xl border-[1.5px] border-foreground/25 text-base font-bold hover:bg-muted"
          >
            <Link href={`/deliveries?claim=${claim.id}`}>
              {labels.deliveriesOpen}
              <ArrowUpRightIcon className="rtl:-scale-x-100" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

/** What happened, in one title and one line, per ending. */
function headOf(
  detail: ClaimDetail,
  locale: Locale
): { title: string; sub: string; tone: Tone; icon: typeof CheckIcon } {
  const labels = t(CLAIMS, locale)
  const { claim } = detail
  const on = (at: number | null) => (at === null ? "—" : fmtDate(at, locale))
  const status = claimStatusLabel(claim.status, locale)

  switch (claim.status) {
    case "awaiting_veto":
      return {
        title: status,
        sub: labels.outcomeAwaitingSub.replace(
          "{date}",
          on(claim.vetoDeadline)
        ),
        tone: "waiting",
        icon: ClockIcon,
      }
    case "released":
      return {
        title: status,
        sub: on(claim.releasedAt),
        tone: "settled",
        icon: CheckIcon,
      }
    case "vetoed":
      return {
        title: status,
        sub: labels.outcomeVetoedSub.replace("{date}", on(claim.closedAt)),
        tone: "settled",
        icon: HeartPulseIcon,
      }
    case "locked":
      return claim.reviewedAt === null
        ? {
            title: labels.outcomeRefused,
            sub: labels.outcomeRefusedSub.replace(
              "{date}",
              on(claim.lockedUntil)
            ),
            tone: "refused",
            icon: XIcon,
          }
        : {
            title: labels.outcomeRejected,
            sub: on(claim.reviewedAt),
            tone: "refused",
            icon: XIcon,
          }
    case "closed":
    case "submitted":
      return {
        title: status,
        sub: labels.outcomeClosedSub.replace("{date}", on(claim.closedAt)),
        tone: "plain",
        icon: MinusIcon,
      }
  }
}

function Row({
  label,
  tone,
  children,
}: {
  label: string
  tone?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5 py-3.5">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          "flex flex-wrap items-baseline gap-x-2 text-base font-bold",
          tone
        )}
      >
        {children}
      </span>
    </div>
  )
}

function Muted({ children }: { children: ReactNode }) {
  return (
    <span className="text-sm font-normal text-muted-foreground">
      {children}
    </span>
  )
}
