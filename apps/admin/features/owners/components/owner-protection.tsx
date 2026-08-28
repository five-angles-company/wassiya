"use client"

import type { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import type { FunctionReturnType } from "convex/server"

import {
  Fact,
  FactsEmpty,
  OwnerFacts,
} from "@/features/owners/components/owner-facts"
import {
  guardianStateLabel,
  guardianStateVariant,
  type GuardianState,
} from "@/lib/guardian-state"
import { OWNERS } from "@/features/owners/strings/owners"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

type Detail = FunctionReturnType<typeof api.admin.ownerDetail>

/**
 * The vault, the check-in and the guardians — the three things that decide
 * whether anything this owner stored ever reaches anyone.
 *
 * ## What the vault card deliberately does not show
 *
 * Dates and a version number. `ownerDetail` returns no `mkWrappedByRecovery`,
 * and there is no console anywhere that could decrypt it if it did. The card
 * says so in words rather than leaving an operator to wonder whether the
 * absence is a permission problem — someone who cannot see vault contents
 * should know that is the design, not their access level.
 *
 * A wrapper with no version is the pre-AAD construction, which this build
 * cannot open: the owner's sheet is already dead and only a device that still
 * holds their key can mint a new one. Flagged here because it is invisible
 * everywhere else until the day it matters.
 */
export function OwnerProtection({
  detail,
  locale,
  now,
}: {
  detail: Detail
  locale: Locale
  /**
   * Captured once by the caller, not read here.
   *
   * `Date.now()` in a render body is an impure call: React may render twice
   * and get two answers, and a guardian could flip between `invited` and
   * `expired` between them. Taking it as a prop makes the boundary a value the
   * component is given rather than a clock it reaches for.
   */
  now: number
}) {
  const labels = t(OWNERS, locale)
  const { vault, checkin, guardians } = detail

  return (
    <div className="flex flex-col gap-4">
      <OwnerFacts title={labels.sectionVault}>
        {vault === null ? (
          <FactsEmpty>{labels.vaultNone}</FactsEmpty>
        ) : (
          <>
            <Fact label={labels.paperVersion} value={vault.paperVersion} />
            <Fact
              label={labels.paperPrinted}
              value={
                vault.paperPrintedAt === null ? (
                  <span className="text-muted-foreground">
                    {labels.paperNotPrinted}
                  </span>
                ) : (
                  fmtDate(vault.paperPrintedAt, locale)
                )
              }
            />
            <Fact
              label={labels.paperUsed}
              value={
                vault.paperUsedAt === null
                  ? labels.none
                  : fmtDate(vault.paperUsedAt, locale)
              }
            />
            <Fact
              label={labels.rotatedAt}
              value={fmtDate(vault.rotatedAt, locale)}
            />
            {vault.wrapperVersion === null && (
              <Fact
                label={labels.paperVersion}
                value={
                  <Badge variant="destructive">{labels.wrapperLegacy}</Badge>
                }
              />
            )}
            <p className="px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
              {labels.vaultNote}
            </p>
          </>
        )}
      </OwnerFacts>

      <OwnerFacts title={labels.sectionCheckin}>
        {checkin === null ? (
          <FactsEmpty>{labels.checkinNone}</FactsEmpty>
        ) : (
          <>
            <Fact
              label={labels.cadence.replace(
                "{n}",
                String(checkin.cadenceMonths)
              )}
              value={<Badge variant="outline">{checkin.escalationState}</Badge>}
            />
            <Fact
              label={labels.nextDue}
              value={fmtDate(checkin.nextDueAt, locale)}
            />
          </>
        )}
      </OwnerFacts>

      <OwnerFacts title={labels.sectionGuardians}>
        {guardians.length === 0 ? (
          <FactsEmpty>{labels.guardiansNone}</FactsEmpty>
        ) : (
          guardians.map((guardian) => {
            // The same derived state the guardians list shows, rebuilt from the
            // same three facts so the two screens cannot disagree about who is
            // actually usable.
            const state: GuardianState =
              guardian.status === "revoked"
                ? "revoked"
                : guardian.status === "accepted"
                  ? guardian.hasPublicKey
                    ? "live"
                    : "accepted"
                  : guardian.inviteExpiresAt < now
                    ? "expired"
                    : "invited"
            return (
              <Fact
                key={guardian.id}
                label={guardian.relation}
                value={
                  <span className="flex items-center justify-end gap-2">
                    <span>{guardian.name}</span>
                    <Badge variant={guardianStateVariant(state)}>
                      {guardianStateLabel(state, locale)}
                    </Badge>
                  </span>
                }
              />
            )
          })
        )}
      </OwnerFacts>
    </div>
  )
}
