"use client"

import Link from "next/link"
import { api } from "@workspace/backend/api"
import { useConvexAuth, useQuery } from "convex/react"

import { ButtonLink } from "@/components/button"
import { Ask } from "@/components/doc/ask"
import { Ledger } from "@/components/doc/ledger"
import { Prose } from "@/components/doc/prose"
import { StatusLine } from "@/components/doc/status-line"
import { DocTitle } from "@/components/doc/title"
import { HowItOpens } from "@/components/how-it-opens"
import { useLocale } from "@/components/locale-provider"
import { RecordNotFound } from "@/components/record-not-found"
import { shortRef } from "@/lib/claim-ref"
import { fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { CertificatePanel } from "@/features/claims/components/certificate-panel"
import { IdentityPanel } from "@/features/claims/components/identity-panel"
import { VetoCountdown } from "@/features/claims/components/veto-countdown"
import { heirView } from "@/features/claims/lib/heir-view"
import { CLAIM_STATUS } from "@/features/claims/strings/claim-status"
import { CLAIMS } from "@/features/claims/strings/claims"

/**
 * One report, as the person who filed it sees it — and as anyone they forward
 * the link to sees it.
 *
 * ## Three readers, one page
 *
 * **The claimant.** `claims.forClaimant` is theirs: auth-gated, so it can be
 * generous, and it makes `isMine` a server fact rather than something the page
 * infers by scanning a capped list.
 *
 * **A signed-out reader.** `claims.publicStatus` needs no account — the claim
 * id is the capability, and the funnel is written to be forwarded to a
 * relative. They see the whole record and every date; what they are offered is
 * a way in, because it is the only thing they can act on.
 *
 * **Someone signed in who is not the claimant.** `forClaimant` returns `null`
 * for them, so they fall through to the public read. They are told whose report
 * this is rather than asked to sign in again — they already have a session, and
 * starting a second one returns them here to read the same instruction.
 *
 * ## ⚠️ `claims.mine` must never be called here
 *
 * It derives the caller with `getCurrentUserOrThrow`, which **throws** for a
 * signed-out reader — and this page is rendered for exactly that person,
 * outside `(app)` and outside its error boundary. Gate on `useConvexAuth`,
 * never on Clerk's state: Convex's is what decides whether a query succeeds.
 */
export function HeirCase({ claimId }: { claimId: string }) {
  const locale = useLocale()
  const labels = t(CLAIMS, locale)
  const common = t(COMMON, locale)
  const status = t(CLAIM_STATUS, locale)

  const { isAuthenticated } = useConvexAuth()
  const claim = useQuery(api.claims.publicStatus, { claimId })
  const own = useQuery(
    api.claims.forClaimant,
    isAuthenticated ? { claimId } : "skip"
  )
  const identity = useQuery(api.identity.status, isAuthenticated ? {} : "skip")
  // Only to decide whether this reader has anywhere else to go — see the footer.
  const summary = useQuery(api.claims.mineSummary, isAuthenticated ? {} : "skip")

  if (claim === undefined) {
    return (
      <div className="border-border h-72 animate-pulse border-y" aria-hidden />
    )
  }
  if (claim === null) {
    return (
      <RecordNotFound id={claimId} backHref="/" backLabel={labels.backToList} />
    )
  }

  const isMine = own !== undefined && own !== null
  const name = claim.subjectName ?? labels.unknownVault

  // The live value, from the claimant's own user row. A signed-out reader gets
  // the claim's snapshot instead — all `publicStatus` carries, and correct for
  // a reader who cannot act on it either way.
  const identityVerified = isMine
    ? identity?.status === "verified"
    : claim.identityVerified

  const view = heirView(
    {
      status: claim.status,
      submittedAt: claim.submittedAt,
      vetoDeadline: claim.vetoDeadline,
      certificateReceived: claim.certificateReceived,
      guardianConfirmed: claim.guardianConfirmed,
      identityVerified,
      isMine,
      certificateAttachedAt: own?.certificateAttachedAt,
      reviewedAt: own?.reviewedAt,
      releasedAt: own?.releasedAt,
    },
    locale
  )

  return (
    <article className="flex flex-col gap-11">
      <DocTitle
        title={labels.detailTitle.replace("{name}", name)}
        meta={
          <>
            <span className="ltr-isolate font-mono">{shortRef(claim.id)}</span>
            {" · "}
            {common.filedOn} {fmtDate(new Date(claim.submittedAt), locale)}
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <StatusLine tone={view.tone}>{view.headline}</StatusLine>

        {view.body.length > 0 && (
          <Prose>
            {view.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Prose>
        )}

        {claim.status === "awaiting_veto" && claim.vetoDeadline !== null && (
          <VetoCountdown deadline={claim.vetoDeadline} />
        )}

        {/* The way out has to be here. `/` sends a reader with one report
            straight into it, so somebody whose only report was closed for a
            mistyped address would be told to file again with nowhere to do it. */}
        {claim.status === "closed" && isMine && (
          <div className="pt-1">
            <ButtonLink href="/file">{labels.fileAgain}</ButtonLink>
          </div>
        )}

        {/* Whose report this is, said plainly. Without it a reader who was
            forwarded the link reads a record they cannot act on and has to
            infer why. */}
        {isAuthenticated && !isMine && (
          <Prose>
            <p className="text-muted-foreground">{labels.notYoursBody}</p>
          </Prose>
        )}
      </div>

      {view.ask !== null && view.askTitle !== null && (
        <Ask eyebrow={common.askEyebrow} title={view.askTitle}>
          {view.ask === "identity" && (
            <IdentityPanel returnTo={`/case/${claimId}`} />
          )}
          {view.ask === "certificate" && (
            <CertificatePanel claimId={claimId} />
          )}
          {view.ask === "box" && (
            <>
              <HowItOpens />
              <div>
                <ButtonLink href={`/case/${claimId}/box`}>
                  {status.openBox}
                </ButtonLink>
              </div>
            </>
          )}
        </Ask>
      )}

      {!isAuthenticated && (
        <Ask eyebrow={common.askEyebrow} title={labels.signInTitle}>
          <Prose>
            <p>{labels.signInBody}</p>
          </Prose>
          <div>
            <ButtonLink
              href={`/sign-in?redirect_url=${encodeURIComponent(`/case/${claimId}`)}`}
            >
              {labels.signInAction}
            </ButtonLink>
          </div>
        </Ask>
      )}

      <Ledger entries={view.ledger} nowLabel={common.stepNow} />

      {/* Everything this reader can do that is not an errand. Both links exist
          because there is no nav: `/` drops a reader with one report straight
          into it, so for most people there is nowhere else and the first link
          is absent — and the second is the only route from a live report to
          filing a second one. Suppressed when `closed`, which offers it above
          as the primary action. */}
      {isMine && (
        <footer className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
          {summary !== undefined && summary !== null && summary.count > 1 && (
            <Link
              href="/"
              className="text-foreground decoration-surface-accent font-semibold underline decoration-2 underline-offset-4"
            >
              {labels.otherCases}
            </Link>
          )}
          {claim.status !== "closed" && (
            <Link
              href="/file"
              className="text-foreground decoration-surface-accent font-semibold underline decoration-2 underline-offset-4"
            >
              {labels.fileAgain}
            </Link>
          )}
        </footer>
      )}
    </article>
  )
}
