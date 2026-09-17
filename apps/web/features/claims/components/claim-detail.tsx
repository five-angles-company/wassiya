"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"
import { CheckIcon, PackageIcon } from "lucide-react"

import { ButtonLink } from "@/components/button"
import { ClaimStatusPill } from "@/components/claim-status-pill"
import { Panel } from "@/components/panel"
import { Section } from "@/components/section"
import { RecordNotFound } from "@/components/record-not-found"
import { useLocale } from "@/components/locale-provider"
import { shortRef } from "@/lib/claim-ref"
import { fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { CertificatePanel } from "@/features/claims/components/certificate-panel"
import { ClaimTimeline } from "@/features/claims/components/claim-timeline"
import { IdentityPanel } from "@/features/claims/components/identity-panel"
import { VetoCountdown } from "@/features/claims/components/veto-countdown"
import { CLAIM_STATUS } from "@/features/claims/strings/claim-status"
import { CLAIMS } from "@/features/claims/strings/claims"

/**
 * One report: what is being asked of the reader, then where the report stands.
 * The outstanding step is the panel at the top — identity, then certificate,
 * then nothing at all — so someone returning a week later need not remember
 * which step they reached.
 *
 * **Which "identity verified" decides the step is load-bearing.** There are two
 * and they may disagree: `claims.claimantIdentityStatus` is a snapshot taken at
 * submit, refreshed only as a side effect of `adminSetNameMatch`, while
 * `users.identityStatus` is what the Didit webhook writes and is live. Someone
 * who files first and verifies afterwards — the ordinary case — sits between
 * them. Branching on the snapshot deadlocks exactly that person: the page
 * renders `IdentityPanel`, which reads the live value and reports "verified", an
 * ask that answers itself with the certificate step never appearing behind it.
 * So the step is chosen on the live value, and `attachCertificate` gates on
 * ownership and an open claim rather than on identity.
 *
 * The actions are gated on ownership; the reading is not. `claims.publicStatus`
 * has no claimant check on purpose — the URL is a capability and a forwarded
 * relative is meant to read the status — but a Didit session started against
 * someone else's claim is a billed verification of the wrong person.
 *
 * The countdown is a component, not a number: a Convex query does not re-run
 * because time passed, and reading the clock during render is impure.
 * `VetoCountdown` owns both problems.
 */
export function ClaimDetail({ claimId }: { claimId: string }) {
  const locale = useLocale()
  const labels = t(CLAIMS, locale)
  const status = t(CLAIM_STATUS, locale)
  const common = t(COMMON, locale)

  const claim = useQuery(api.claims.publicStatus, { claimId })
  const identity = useQuery(api.identity.status, {})
  const mine = useQuery(api.claims.mine, {})

  if (claim === undefined) {
    return <p className="text-muted-foreground text-[14.5px]">{status.loading}</p>
  }
  if (claim === null) {
    return (
      <RecordNotFound
        id={claimId}
        backHref="/claims"
        backLabel={labels.backToList}
      />
    )
  }

  const name = claim.subjectName ?? labels.unknownVault
  // Live, not the claim's snapshot — see the header. In flight counts as
  // unverified, which delays the panel by a frame and never shows an ask that
  // is already answered.
  const identityVerified = identity?.status === "verified"
  // Loading and not-mine both render the report without its actions, rather
  // than guessing in the reader's favour.
  const isMine = mine?.some((row) => row.id === claim.id) === true

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-[26px] leading-tight font-extrabold md:text-[30px]">
            {labels.detailTitle.replace("{name}", name)}
          </h1>
          <p className="text-muted-foreground mt-2 text-[13.5px]">
            <span className="ltr-isolate font-mono">{shortRef(claim.id)}</span>
            {" · "}
            {common.filedOn} {fmtDate(new Date(claim.submittedAt), locale)}
          </p>
        </div>
        <ClaimStatusPill status={claim.status} locale={locale} />
      </header>

      {/* Exactly one panel. A terminal state outranks an ask: a released box
          must not be hidden behind an identity prompt because a later Didit
          webhook flipped the live status, and a vetoed claim must never ask for
          a certificate it will not use. */}
      {claim.status === "released" ? (
        <Panel accent="secondary" icon={PackageIcon} title={status.releasedHeading}>
          <p className="text-muted-foreground mb-5 max-w-[62ch] text-[14.5px] leading-[1.7]">
            {status.releasedBody}
          </p>
          {isMine && (
            <ButtonLink href={`/box/${claim.id}`}>
              {status.openBox}
            </ButtonLink>
          )}
          <p className="text-muted-foreground mt-4 text-[13px] leading-[1.6]">
            {status.releasedKeyNote}
          </p>
        </Panel>
      ) : claim.status === "vetoed" ? (
        <Panel title={status.vetoedHeading}>
          <p className="max-w-[62ch] text-[14.5px] leading-[1.75]">
            {status.vetoedBody}
          </p>
          <p className="text-muted-foreground mt-3 text-[13.5px]">
            {status.vetoedLockout}
          </p>
        </Panel>
      ) : claim.status === "locked" ? (
        <Panel title={status.lockedHeading}>
          <p className="max-w-[62ch] text-[14.5px] leading-[1.75]">
            {status.lockedBody}
          </p>
        </Panel>
      ) : isMine && !identityVerified ? (
        <IdentityPanel />
      ) : isMine && !claim.certificateReceived ? (
        <CertificatePanel claimId={claim.id} />
      ) : (
        <Panel accent="secondary" icon={CheckIcon} title={status.nothingTitle}>
          <p className="text-muted-foreground max-w-[62ch] text-[14.5px] leading-[1.7]">
            {status.nothingBody}
          </p>
          {claim.vetoDeadline !== null && claim.status === "awaiting_veto" && (
            <VetoCountdown deadline={claim.vetoDeadline} />
          )}
        </Panel>
      )}

      <Panel title={status.timelineTitle}>
        <ClaimTimeline
          identityVerified={identityVerified}
          certificateReceived={claim.certificateReceived}
          guardianConfirmed={claim.guardianConfirmed}
          status={claim.status}
          deadline={claim.vetoDeadline}
          submittedAt={claim.submittedAt}
          locale={locale}
        />
      </Panel>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title={status.othersTitle}>
          <p className="text-muted-foreground text-[14px] leading-[1.7]">
            {status.othersBody}
          </p>
        </Section>
        <Section title={common.reference}>
          <p className="text-muted-foreground text-[14px] leading-[1.7]">
            {status.refNote.replace("{ref}", shortRef(claim.id))}
          </p>
        </Section>
      </div>
    </div>
  )
}
