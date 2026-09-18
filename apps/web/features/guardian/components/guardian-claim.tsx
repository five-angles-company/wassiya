"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"

import { Ask } from "@/components/doc/ask"
import { Ledger } from "@/components/doc/ledger"
import { Prose } from "@/components/doc/prose"
import { StatusLine } from "@/components/doc/status-line"
import { DocTitle } from "@/components/doc/title"
import { RecordNotFound } from "@/components/record-not-found"
import { useLocale } from "@/components/locale-provider"
import { fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { ConfirmPanel } from "@/features/guardian/components/confirm-panel"
import { HandoverPanel } from "@/features/guardian/components/handover-panel"
import { guardianView } from "@/features/guardian/lib/guardian-view"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

/**
 * One claim, from the guardian's side.
 *
 * ## `claimForGuardian`, not a filtered list
 *
 * This read the whole of `pendingApprovals` and picked its row out by id, which
 * cost two things worth naming because both were visible to a real person:
 *
 * **Confirming looked like a failure.** `guardianConfirm` moves the claim out of
 * `guardian_review`, which is one of the two statuses that list queries — so the
 * row vanished the instant the mutation succeeded, the `find` returned nothing,
 * and the screen showed "we could not find this". It was worked around by
 * holding a `confirmed` flag above the subscription. The flag is gone: the query
 * returns the claim in whatever state it is now, and the record simply advances.
 *
 * **A finished claim was unreadable.** `vetoed`, `locked` and `awaiting_veto`
 * appear in no list query, so a guardian who confirmed last week and came back
 * to see what happened was told the claim did not exist.
 *
 * `RecordNotFound` is kept for the one case that means it: an id that is not a
 * claim, or is a claim on a vault this person does not guard —
 * `requireAcceptedGuardian` refuses that, and the query returns `null`.
 */
export function GuardianClaim({ claimId }: { claimId: string }) {
  const locale = useLocale()
  const labels = t(GUARDIAN_DUTIES, locale)
  const common = t(COMMON, locale)
  const claim = useQuery(api.guardians.claimForGuardian, { claimId })

  if (claim === undefined) {
    return (
      <div className="border-border h-80 animate-pulse border-y" aria-hidden />
    )
  }
  if (claim === null) {
    return (
      <RecordNotFound id={claimId} backHref="/guardian" backLabel={labels.title} />
    )
  }

  const subjectName = claim.subjectName ?? "—"

  const view = guardianView(
    {
      duty: claim.duty,
      status: claim.status,
      guardianConfirmedAt: claim.guardianConfirmedAt,
      vetoDeadline: claim.vetoDeadline,
      submittedAt: claim.submittedAt,
      heirLinked: claim.heirLinked,
    },
    locale
  )

  return (
    <article className="flex flex-col gap-11">
      <DocTitle
        title={labels.claimTitle.replace("{name}", subjectName)}
        meta={`${common.filedOn} ${fmtDate(new Date(claim.submittedAt), locale)}`}
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
      </div>

      {view.ask !== null && view.askTitle !== null && (
        <Ask eyebrow={common.askEyebrow} title={view.askTitle}>
          {view.ask === "confirm" && (
            <ConfirmPanel
              claimId={claim.claimId}
              claimantName={claim.claimantName}
              certificateName={claim.certificateName}
              nameMatch={claim.nameMatch}
              heirLinked={claim.heirLinked}
            />
          )}
          {view.ask === "handover" && (
            <HandoverPanel claimId={claim.claimId} />
          )}
        </Ask>
      )}

      <Ledger entries={view.ledger} nowLabel={common.stepNow} />
    </article>
  )
}
