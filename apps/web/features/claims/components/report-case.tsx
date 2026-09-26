"use client"

import Link from "next/link"
import { api } from "@workspace/backend/api"
import { useConvexAuth, useQuery } from "convex/react"
import { FileTextIcon, LogInIcon } from "lucide-react"

import { ButtonLink } from "@/components/button"
import { Ask } from "@/components/doc/ask"
import { Ledger } from "@/components/doc/ledger"
import { StatusBanner } from "@/components/doc/status-banner"
import { DocTitle } from "@/components/doc/title"
import { useLocale } from "@/components/locale-provider"
import { Placeholder } from "@/components/placeholder"
import { RecordNotFound } from "@/components/record-not-found"
import { shortRef } from "@/lib/claim-ref"
import { fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { CertificatePanel } from "@/features/claims/components/certificate-panel"
import { caseView } from "@/features/claims/lib/case-view"
import { CLAIM_STATUS } from "@/features/claims/strings/claim-status"
import { CLAIMS } from "@/features/claims/strings/claims"

/**
 * One report, as the person who filed it sees it — and as anyone they forward
 * the link to sees it.
 *
 * - **The person who filed:** `claims.forClaimant` is theirs, auth-gated, and
 *   makes `isMine` a server fact.
 * - **A signed-out reader:** `claims.publicStatus` needs no account — the claim
 *   id is the capability, and the page is written to be forwarded. They are
 *   offered a way in, the only thing they can act on.
 * - **Someone signed in who did not file it:** told whose report this is,
 *   rather than asked to sign in again.
 *
 * ⚠️ `claims.mine` must never be called here: it throws for a signed-out
 * reader, and this page is rendered for exactly that person. Gate on
 * `useConvexAuth`, never on Clerk's state.
 */
export function ReportCase({ claimId }: { claimId: string }) {
  const locale = useLocale()
  const labels = t(CLAIMS, locale)
  const status = t(CLAIM_STATUS, locale)
  const common = t(COMMON, locale)

  const { isAuthenticated } = useConvexAuth()
  const claim = useQuery(api.claims.publicStatus, { claimId })
  const own = useQuery(api.claims.forClaimant, isAuthenticated ? { claimId } : "skip")
  // Only to decide whether this reader has anywhere else to go — see the footer.
  const summary = useQuery(api.claims.mineSummary, isAuthenticated ? {} : "skip")

  if (claim === undefined) return <Placeholder label={common.loading} className="h-96" />
  if (claim === null) return <RecordNotFound id={claimId} backHref="/" backLabel={labels.backToList} />

  const isMine = own !== undefined && own !== null
  const name = claim.subjectName ?? labels.unknownVault

  const view = caseView(
    {
      status: claim.status,
      submittedAt: claim.submittedAt,
      vetoDeadline: claim.vetoDeadline,
      certificateReceived: claim.certificateReceived,
      isMine,
      certificateAttachedAt: own?.certificateAttachedAt,
      reviewedAt: own?.reviewedAt,
      releasedAt: own?.releasedAt,
    },
    locale
  )

  const footerLink =
    "border-border bg-card/60 hover:bg-card inline-flex h-10 items-center rounded-full border px-5 text-[14px] font-semibold transition-colors"

  return (
    <article className="flex flex-col gap-6">
      <DocTitle
        eyebrow={labels.detailEyebrow}
        title={labels.detailTitle.replace("{name}", name)}
        meta={
          <>
            <span className="ltr-isolate font-mono">{shortRef(claim.id)}</span>
            {" · "}
            {common.filedOn} {fmtDate(new Date(claim.submittedAt), locale)}
          </>
        }
      />

      <div className="mt-4">
        <StatusBanner tone={view.tone} icon={view.icon} headline={view.headline} date={view.date}>
          {view.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {/* Whose report this is, said plainly: a forwarded reader otherwise
              reads a record they cannot act on and has to guess why. */}
          {isAuthenticated && !isMine && <p>{labels.notYoursBody}</p>}
        </StatusBanner>
      </div>

      {/* The way out has to be here: `/` sends a reader with one report
          straight into it, so someone whose only report closed for a typo would
          otherwise be told to file again with nowhere to do it. */}
      {claim.status === "closed" && isMine && (
        <div>
          <ButtonLink href="/file" size="lg">
            {labels.fileAgain}
          </ButtonLink>
        </div>
      )}

      {view.ask === "certificate" && view.askTitle !== null && (
        <Ask eyebrow={common.askEyebrow} title={view.askTitle} icon={FileTextIcon}>
          <CertificatePanel claimId={claimId} />
        </Ask>
      )}

      {!isAuthenticated && (
        <Ask eyebrow={common.askEyebrow} title={labels.signInTitle} icon={LogInIcon}>
          <p className="text-foreground/75 max-w-[62ch] text-[15.5px] leading-[1.85]">{labels.signInBody}</p>
          <div>
            <ButtonLink href={`/sign-in?redirect_url=${encodeURIComponent(`/case/${claimId}`)}`} size="lg">
              {labels.signInAction}
            </ButtonLink>
          </div>
        </Ask>
      )}

      <Ledger title={status.timelineTitle} entries={view.ledger} nowLabel={common.stepNow} />

      {isMine && (summary?.count ?? 0) + (claim.status !== "closed" ? 1 : 0) > 1 && (
        <footer className="flex flex-wrap gap-2.5">
          {summary !== undefined && summary !== null && summary.count > 1 && (
            <Link href="/" className={footerLink}>
              {labels.otherCases}
            </Link>
          )}
          {claim.status !== "closed" && (
            <Link href="/file" className={footerLink}>
              {labels.fileAgain}
            </Link>
          )}
        </footer>
      )}
    </article>
  )
}
