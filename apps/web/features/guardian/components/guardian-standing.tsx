"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"

import Link from "next/link"

import { Prose } from "@/components/doc/prose"
import { RowLink, Rows } from "@/components/doc/rows"
import { DocTitle } from "@/components/doc/title"
import { EmptyState } from "@/components/empty-state"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { RoleReminder } from "@/features/guardian/components/role-reminder"
import { VaultsPanel } from "@/features/guardian/components/vaults-panel"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

/**
 * The guardian's standing state — now a state of `/`, not a page of its own.
 *
 * ## The long middle is the normal state
 *
 * A guardian acts twice at most in the whole life of a guardianship, possibly
 * years apart. Everything between is "nothing needs you" — which is not an empty
 * dashboard to apologise for, it is the answer.
 *
 * So the idle screen is not a blank list. It is what a person who has not
 * thought about this since the day they accepted actually needs: **what they
 * agreed to**, in the invitation's own words (`RoleReminder`), and **which
 * vaults** they hold (`VaultsPanel`).
 *
 * ## 🚨 This used to be `/guardian`, and the route was a trap
 *
 * `/guardian` was reachable from one place: `case-router.tsx`'s redirect, on the
 * single row where a guardian has vaults and **no duty pending**. So the page
 * existed only for readers with nothing to do — and a guardian with a duty
 * waiting was routed past it with no way back, which is how the key check became
 * unreachable in the week it matters most.
 *
 * Deleting the route rather than linking to it is the right repair because the
 * content was never a destination: it is what `/` should say to this reader when
 * there is nothing in flight. `WelcomeDoors` already plays that part for
 * somebody with no vaults; this is the same job one row down the table.
 *
 * ## ⚠️ The key left, and that is the point of the change
 *
 * `GuardianKey` is `/guardian/key` now, reached from the account menu — a thing
 * needed on no particular schedule, reachable whether or not a duty is waiting.
 * It is linked from here too: a reader who arrives with nothing to do is exactly
 * the one who came to check the sheet in their drawer.
 *
 * ## Why the guardian keeps a second URL where the heir has one
 *
 * A guardianship has no claim attached for the years in the middle, so the thing
 * in flight is a **duty**, not a guardianship. `/guardian/[claimId]` is that
 * duty; this is the standing state it interrupts. Collapsing them would mean a
 * case page that is empty for most of its life.
 */
export function GuardianStanding() {
  const locale = useLocale()
  const labels = t(GUARDIAN_DUTIES, locale)
  const common = t(COMMON, locale)
  const duties = useQuery(api.guardians.pendingApprovals, {})
  const vaults = useQuery(api.guardians.guardianFor, {})

  if (duties === undefined || vaults === undefined) {
    return (
      <div className="border-border h-64 animate-pulse border-y" aria-hidden />
    )
  }

  if (vaults.length === 0) {
    return <EmptyState title={labels.vaultsTitle} body={labels.vaultsEmpty} />
  }

  return (
    <div className="flex flex-col gap-11">
      <DocTitle title={labels.title} />

      <Prose>
        <p>{labels.body}</p>
      </Prose>

      {duties.length > 0 && (
        <Rows>
          {duties.map((duty) => {
            // A confirm with no heir linked cannot be actioned —
            // `guardianConfirm` throws on it. It stays in the list rather than
            // being filtered out: a guardian who was emailed and then finds
            // nothing here has been told the app is broken.
            const blocked = duty.duty === "confirm" && !duty.heirLinked
            return (
              <RowLink
                key={`${duty.claimId}-${duty.duty}`}
                href={`/guardian/${duty.claimId}`}
                title={(duty.duty === "confirm"
                  ? labels.dutyConfirmTitle
                  : labels.dutyHandoverTitle
                ).replace("{name}", duty.subjectName ?? "—")}
                status={
                  blocked
                    ? labels.notLinkedBody
                    : duty.duty === "confirm"
                      ? labels.dutyConfirmBody
                      : labels.handoverBody
                }
                tone={blocked ? "quiet" : "attention"}
              />
            )
          })}
        </Rows>
      )}

      <RoleReminder />
      <VaultsPanel />

      {/* ⚠️ **A link, where the panel itself used to sit.** The key is its own
          route now so that a guardian mid-duty can reach it; leaving a copy here
          would mean two places to keep true, and the one on the busier page
          would be the one that drifts. */}
      <p className="text-muted-foreground text-[14px]">
        <Link
          href="/guardian/key"
          className="text-foreground decoration-surface-accent font-semibold underline decoration-2 underline-offset-4"
        >
          {labels.keyTitle}
        </Link>
      </p>

      {/* A guardian is somebody's trusted person, and may well be bereaved
          themselves. This is the only route to filing for someone who guards a
          vault and has never filed — they land here from `/`, and there is no
          list for them to reach.

          Quiet rather than a button: nothing about guarding a vault suggests
          this reader needs it today, and a prominent "report a death" on the
          page somebody opens to check their key would read as a prompt. */}
      <p className="text-muted-foreground text-[14px]">
        {common.fileReportPrompt}{" "}
        <Link
          href="/file"
          className="text-foreground decoration-surface-accent font-semibold underline decoration-2 underline-offset-4"
        >
          {common.fileReportLink}
        </Link>
      </p>
    </div>
  )
}
