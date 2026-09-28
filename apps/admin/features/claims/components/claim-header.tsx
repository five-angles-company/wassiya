"use client"

import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { ArrowRightIcon } from "lucide-react"

import type { ClaimDetail } from "@/features/claims/lib/detail"
import { CLAIMS } from "@/features/claims/strings/claims"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

/** Whose report this is, and one sentence on where it stands. */
export function ClaimHeader({
  detail,
  locale,
}: {
  detail: ClaimDetail
  locale: Locale
}) {
  const labels = t(CLAIMS, locale)
  const { subject } = detail
  const who =
    subject.verifiedName ??
    subject.name ??
    subject.email ??
    labels.subjectUnmatched

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="-ms-2 self-start text-muted-foreground"
      >
        <Link href="/claims">
          {/* Back points right in RTL, so only LTR turns it. */}
          <ArrowRightIcon className="size-4 ltr:rotate-180" aria-hidden />
          {labels.back}
        </Link>
      </Button>
      <h1 className="font-heading text-[26px] leading-snug font-extrabold tracking-tight">
        {labels.reviewTitle} · <bdi>{who}</bdi>
      </h1>
      <p className="text-sm text-muted-foreground">
        {situation(detail, locale)}
      </p>
    </div>
  )
}

function situation(detail: ClaimDetail, locale: Locale): string {
  const labels = t(CLAIMS, locale)
  const { claim, subject } = detail
  const on = (template: string, at: number | null) =>
    template.replace("{date}", at === null ? "—" : fmtDate(at, locale))

  switch (claim.status) {
    case "submitted":
      if (subject.id === null) return labels.sitUnmatched
      if (claim.certificateUrl === null) return labels.sitNoCertificate
      return on(labels.sitSubmitted, claim.submittedAt)
    case "awaiting_veto":
      return on(labels.sitAwaiting, claim.vetoDeadline)
    case "released":
      return on(labels.sitReleased, claim.releasedAt)
    case "vetoed":
      return on(labels.sitVetoed, claim.closedAt)
    case "locked":
      return claim.reviewedAt === null
        ? on(labels.sitLockedAtFiling, claim.lockedUntil)
        : on(labels.sitLocked, claim.reviewedAt)
    case "closed":
      return on(labels.sitClosed, claim.closedAt)
  }
}
