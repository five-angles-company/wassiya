"use client"

import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"

import { useLocale } from "@/components/locale-provider"
import { TableCard } from "@/components/table-card"
import {
  SettingFact,
  SettingRows,
} from "@/features/settings/components/setting-row"
import { SETTINGS } from "@/features/settings/strings/settings"
import { fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"

/**
 * The windows the product runs on — read, never written.
 *
 * It exists because staff are asked "how long until this opens?" by families,
 * and until now the only answer was to read `model/claimFlow.ts`. It is served
 * by `settings.policy` rather than restated here for the reason the plan
 * catalogue is served: a number copied into a component is wrong the day the
 * code changes, and nothing surfaces it.
 *
 * **There is no save button, and that is the feature.** Several of these are
 * promises AGENTS.md marks LOCKED. A mistyped veto window changes how long a
 * grieving family waits; a mistyped delivery window changes the day a vault is
 * deleted forever. Both stay a code change and a review.
 */
export function PolicyPanel() {
  const locale = useLocale()
  const labels = t(SETTINGS, locale)
  const policy = useQuery(api.settings.policy)

  if (policy === undefined) {
    return <Skeleton className="h-80 w-full rounded-xl" />
  }

  const days = (n: number) => labels.days.replace("{n}", fmtNumber(n, locale))
  const locked = (
    <Badge variant="outline" className="font-normal">
      {labels.locked}
    </Badge>
  )

  return (
    <div className="flex flex-col gap-6">
      <TableCard title={labels.sectionClaims} footnote={labels.lockedFootnote}>
        <SettingRows>
          <SettingFact
            label={labels.vetoWindow}
            hint={labels.vetoWindowHint}
            value={days(policy.vetoWindowDays)}
            badge={locked}
          />
          <SettingFact
            label={labels.vetoLockout}
            hint={labels.vetoLockoutHint}
            value={days(policy.vetoLockoutDays)}
            badge={locked}
          />
          <SettingFact
            label={labels.claimRate}
            hint={labels.claimRateHint}
            value={labels.perDay.replace(
              "{n}",
              fmtNumber(policy.claimRateLimitPerDay, locale)
            )}
          />
        </SettingRows>
      </TableCard>

      <TableCard title={labels.sectionDelivery}>
        <SettingRows>
          <SettingFact
            label={labels.deliveryWindow}
            hint={labels.deliveryWindowHint}
            value={days(policy.deliveryWindowDays)}
            badge={locked}
          />
        </SettingRows>
      </TableCard>

      <TableCard title={labels.sectionCheckin}>
        <SettingRows>
          <SettingFact
            label={labels.escalation}
            hint={labels.escalationHint}
            value={policy.escalationDays
              .map((day) => fmtNumber(day, locale))
              .join(" · ")}
            badge={locked}
          />
          <SettingFact
            label={labels.snooze}
            hint={labels.snoozeHint}
            value={days(policy.snoozeDays)}
          />
        </SettingRows>
      </TableCard>

      <TableCard title={labels.sectionIdentity}>
        <SettingRows>
          <SettingFact
            label={labels.maxAttempts}
            hint={labels.maxAttemptsHint}
            value={fmtNumber(policy.maxIdentityAttempts, locale)}
          />
          <SettingFact
            label={labels.diditWorkflow}
            hint={labels.diditWorkflowHint}
            value={
              policy.diditWorkflowConfigured
                ? labels.credSet
                : labels.credMissing
            }
          />
        </SettingRows>
      </TableCard>
    </div>
  )
}
