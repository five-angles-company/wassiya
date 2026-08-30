"use client"

import Link from "next/link"
import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"
import { PackageIcon } from "lucide-react"

import { ClaimStatusPill } from "@/components/claim-status-pill"
import { Panel } from "@/components/panel"
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
 *
 * ## The next step is at the top, and there is only ever one
 *
 * The funnel this replaces was three routes deep, which meant someone coming
 * back a week later had to remember which step they had reached. Here the
 * report *is* the screen and the outstanding step is the panel at the top of it
 * — identity, then certificate, then nothing at all. Once both are done the
 * page has no ask on it, and says so out loud rather than leaving a gap where
 * the reader looks for one.
 *
 * ## Which "identity verified" decides the step (this bit is load-bearing)
 *
 * There are two, and they are allowed to disagree.
 * `claims.claimantIdentityStatus` is a **snapshot taken at submit**, refreshed
 * only as a side effect of an admin's `adminSetNameMatch`;
 * `users.identityStatus` is what the Didit webhook writes and is live. Someone
 * who files first and verifies afterwards — the ordinary case — sits between
 * the two for as long as review takes.
 *
 * Branching on the snapshot would deadlock exactly that person: the page would
 * decide identity is outstanding and render `IdentityPanel`, which reads the
 * live value and reports "verified" — an ask that answers itself, with the
 * certificate step never appearing behind it.
 *
 * So the step is chosen on the **live** value, which is also the one the reader
 * can act on. `attachCertificate` gates on ownership and an open claim, not on
 * identity, so proceeding is genuinely correct and the snapshot catches up at
 * review.
 *
 * ## The actions are gated on ownership; the reading is not
 *
 * `claims.publicStatus` deliberately has no claimant check — the URL is a
 * capability, and a relative who was forwarded the link is meant to be able to
 * read the status. Hanging the panels off it would be a different thing: a
 * Didit session started against someone else's claim is a billed verification
 * of the wrong person, and an upload would be taken by the browser and refused
 * by the server. `claims.mine` is already in flight for the rail, so checking
 * membership costs nothing.
 *
 * ## The countdown is a component, not a number
 *
 * A Convex query does not re-run because time passed, so a `daysLeft` computed
 * server-side would freeze at whatever it was when the query last ran. Reading
 * the clock during render is not the fix either — it is impure, and React is
 * entitled to render twice. `VetoCountdown` owns both problems.
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
          <h1 className="font-heading text-[24px] leading-tight font-extrabold md:text-[28px]">
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
        <Panel tone="settled" icon={PackageIcon} title={status.releasedHeading}>
          <p className="mb-5 max-w-[62ch] text-[14.5px] leading-[1.7] opacity-90">
            {status.releasedBody}
          </p>
          {isMine && (
            <Link
              href={`/box/${claim.id}`}
              className="text-secondary inline-flex rounded-full bg-[color:var(--secondary-foreground)] px-7 py-3 text-[15px] font-bold"
            >
              {status.openBox}
            </Link>
          )}
          <p className="mt-4 text-[13px] leading-[1.6] opacity-75">
            {status.releasedKeyNote}
          </p>
        </Panel>
      ) : claim.status === "vetoed" ? (
        <Panel tone="plain" title={status.vetoedHeading}>
          <p className="max-w-[62ch] text-[14.5px] leading-[1.75]">
            {status.vetoedBody}
          </p>
          <p className="text-muted-foreground mt-3 text-[13.5px]">
            {status.vetoedLockout}
          </p>
        </Panel>
      ) : claim.status === "locked" ? (
        <Panel tone="plain" title={status.lockedHeading}>
          <p className="max-w-[62ch] text-[14.5px] leading-[1.75]">
            {status.lockedBody}
          </p>
        </Panel>
      ) : isMine && !identityVerified ? (
        <IdentityPanel />
      ) : isMine && !claim.certificateReceived ? (
        <CertificatePanel claimId={claim.id} />
      ) : (
        <Panel tone="settled" title={status.nothingTitle}>
          <p className="max-w-[62ch] text-[14.5px] leading-[1.7] opacity-90">
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

      <div className="grid gap-4 md:grid-cols-2">
        <Panel tone="plain" title={status.othersTitle}>
          <p className="text-muted-foreground text-[14px] leading-[1.7]">
            {status.othersBody}
          </p>
        </Panel>
        <Panel tone="plain" title={common.reference}>
          <p className="text-muted-foreground text-[14px] leading-[1.7]">
            {status.refNote.replace("{ref}", shortRef(claim.id))}
          </p>
        </Panel>
      </div>
    </div>
  )
}
