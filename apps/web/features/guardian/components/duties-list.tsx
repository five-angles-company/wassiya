"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"
import { KeyRoundIcon, ShieldCheckIcon, UserCheckIcon } from "lucide-react"

import { ActionRow } from "@/components/action-row"
import { EmptyState } from "@/components/empty-state"
import { Panel } from "@/components/panel"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

/**
 * Everything a guardian is being asked to do, plus the vaults they guard.
 *
 * `guardians.pendingApprovals` already returns both duties in one list, because
 * they are one screen: a guardian opens this app because they were emailed that
 * something needs them, not knowing which of the two it is.
 *
 * ## The empty state is the normal state
 *
 * A guardian is asked to act twice at most in the whole life of a guardianship,
 * possibly years apart. So "nothing needs you" is not a failure to have data —
 * it is the answer, and it says how long it may last.
 *
 * ## An unlinked claim is described, never offered
 *
 * `claims.guardianConfirm` throws on a claim with no heir linked, and
 * `pendingApprovals` surfaces `heirLinked` precisely so this screen can say so
 * instead of rendering a button that fails. It stays in the list rather than
 * being filtered out: a guardian who was emailed and then finds nothing here
 * has been told the app is broken.
 */
export function DutiesList() {
  const locale = useLocale()
  const labels = t(GUARDIAN_DUTIES, locale)
  const duties = useQuery(api.guardians.pendingApprovals, {})
  const vaults = useQuery(api.guardians.guardianFor, {})

  return (
    <div className="flex flex-col gap-6">
      {duties === undefined ? (
        <div className="bg-card rounded-card h-[92px] animate-pulse" aria-hidden />
      ) : duties.length === 0 ? (
        <EmptyState
          icon={ShieldCheckIcon}
          title={labels.nothingTitle}
          body={labels.nothingBody}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {duties.map((duty) => {
            const name = duty.subjectName ?? "—"
            const blocked = duty.duty === "confirm" && !duty.heirLinked
            return (
              <ActionRow
                key={`${duty.claimId}-${duty.duty}`}
                href={`/guardian/${duty.claimId}`}
                icon={duty.duty === "confirm" ? UserCheckIcon : KeyRoundIcon}
                tone={blocked ? "quiet" : "now"}
                title={(duty.duty === "confirm"
                  ? labels.dutyConfirmTitle
                  : labels.dutyHandoverTitle
                ).replace("{name}", name)}
                body={
                  blocked
                    ? labels.notLinkedBody
                    : duty.duty === "confirm"
                      ? labels.dutyConfirmBody
                      : labels.dutyHandoverBody
                }
              />
            )
          })}
        </div>
      )}

      <Panel title={labels.vaultsTitle}>
        {vaults === undefined ? (
          <div className="bg-background h-16 animate-pulse rounded-[18px]" aria-hidden />
        ) : vaults.length === 0 ? (
          <p className="text-muted-foreground text-[14px] leading-[1.7]">
            {labels.vaultsEmpty}
          </p>
        ) : (
          <ul className="flex flex-col">
            {vaults.map((vault, index) => (
              <li
                key={vault.guardianId}
                className={`flex items-center justify-between gap-4 py-3.5 ${
                  index === 0 ? "" : "border-border border-t"
                }`}
              >
                <span className="text-[15px] font-semibold">
                  {vault.subjectName ?? "—"}
                </span>
                <span className="text-muted-foreground text-[13.5px]">
                  {labels.relation}: {vault.relation}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
