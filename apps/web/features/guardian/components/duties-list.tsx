"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"
import { KeyRoundIcon, ShieldCheckIcon, UserCheckIcon } from "lucide-react"

import { ActionCard } from "@/components/action-card"
import { EmptyState } from "@/components/empty-state"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { VaultsPanel } from "@/features/guardian/components/vaults-panel"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

/**
 * Everything a guardian is being asked to do, and then the vaults they guard.
 *
 * `guardians.pendingApprovals` returns both duties in one list, because they
 * are one screen: a guardian opens this app having been emailed that something
 * needs them, not knowing which of the two it is.
 *
 * ## The asks are the same cards the home screen shows
 *
 * They were full-width rows here while home had already moved to `ActionCard`,
 * so the identical duty looked like two different things depending on which
 * screen you reached it from. One component, both places.
 *
 * ## The empty state is the normal state
 *
 * A guardian is asked to act twice at most in the whole life of a guardianship,
 * possibly years apart. "Nothing needs you" is not a failure to have data — it
 * is the answer, and it says how long it may last.
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
  const labels = t(GUARDIAN_DUTIES, useLocale())
  const duties = useQuery(api.guardians.pendingApprovals, {})

  return (
    <div className="flex flex-col gap-8">
      {/* No section heading: the route already titles this screen "ما هو مطلوب
          منك", and a second heading sixty pixels below saying the same thing is
          the duplication the reports list was just cured of. */}
      <section className="flex flex-col gap-4">
        {duties === undefined ? (
          <div className="grid gap-4 md:grid-cols-2" aria-hidden>
            <div className="bg-card rounded-sheet h-52 animate-pulse" />
            <div className="bg-card rounded-sheet h-52 animate-pulse" />
          </div>
        ) : duties.length === 0 ? (
          <EmptyState
            icon={ShieldCheckIcon}
            title={labels.nothingTitle}
            body={labels.nothingBody}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {duties.map((duty, index) => {
              const name = duty.subjectName ?? "—"
              const blocked = duty.duty === "confirm" && !duty.heirLinked
              return (
                <ActionCard
                  key={`${duty.claimId}-${duty.duty}`}
                  href={`/guardian/${duty.claimId}`}
                  icon={duty.duty === "confirm" ? UserCheckIcon : KeyRoundIcon}
                  tone={blocked ? "waiting" : "now"}
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
                  action={labels.review}
                  delay={index * 70}
                />
              )
            })}
          </div>
        )}
      </section>

      <VaultsPanel />
    </div>
  )
}
