"use client"

import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"
import {
  ClipboardCheckIcon,
  HeartPulseIcon,
  TimerIcon,
  UsersIcon,
} from "lucide-react"

import { StatCard } from "@/components/stat-card"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { DASHBOARD } from "@/features/dashboard/strings/dashboard"
import { fmtDate, fmtNumber, fmtTally } from "@/lib/format"

/**
 * The four numbers that change what someone does today — a claim nobody has
 * ruled on, a veto window running down toward an automatic release, an owner the
 * product has begun escalating against, and heirs who would receive nothing
 * tonight. An earlier version carried a card for every count the backend could
 * produce, and because everything was highlighted, nothing was.
 *
 * Three of the four open the rows they count, and each `href` reproduces its own
 * number exactly. Clicking a tile and counting the rows on arrival is the
 * acceptance test, and the reason the filters moved into the URL.
 *
 * **The fourth stays unlinked, deliberately.** `heirsAtRisk` is heirs whose
 * bundle is missing or older than their routing, summed across owners, while
 * `/heirs` filters on `unroutedOnly` — a different predicate. There is no URL
 * that reproduces the number, so there is no link; its detail is the risk table
 * further down this same page.
 */
export function SummaryBar() {
  const locale = useLocale()
  const labels = t(DASHBOARD, locale)
  const overview = useQuery(api.admin.overview)
  const risk = useQuery(api.admin.risk, {})

  if (overview === undefined) {
    return (
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  // Everything from day 7 onwards. The app's own `use-checkin-state` collapses
  // `day7 | day14 | countdown` into a single "overdue"; the console used to draw
  // that line at day 14, so the two disagreed about when a check-in was late.
  // This is the app's line, because the app is what the owner was told.
  const escalating = {
    count:
      overview.checkin.day7.count +
      overview.checkin.day14.count +
      overview.checkin.countdown.count,
    more:
      overview.checkin.day7.more ||
      overview.checkin.day14.more ||
      overview.checkin.countdown.more,
  }

  const heirsAtRisk =
    risk === undefined
      ? null
      : risk.rows.reduce((sum, row) => sum + row.heirsAtRisk, 0)

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard
        icon={ClipboardCheckIcon}
        label={labels.awaitingReview}
        value={fmtTally(overview.claims.submitted, locale)}
        hint={labels.awaitingReviewHint}
        href="/claims?status=submitted"
        emphasis={overview.claims.submitted.count > 0}
      />
      <StatCard
        icon={TimerIcon}
        label={labels.vetoWindow}
        value={fmtTally(overview.claims.awaiting_veto, locale)}
        hint={labels.vetoWindowHint}
        footer={
          overview.nextReleaseAt === null
            ? undefined
            : `${labels.nextRelease}: ${fmtDate(overview.nextReleaseAt, locale)}`
        }
        href="/claims?status=awaiting_veto"
      />
      <StatCard
        icon={HeartPulseIcon}
        label={labels.escalating}
        value={fmtTally(escalating, locale)}
        hint={labels.escalatingHint}
        href="/checkins?state=day7,day14,countdown"
        emphasis={escalating.count > 0}
      />
      <StatCard
        icon={UsersIcon}
        label={labels.heirsNoBundle}
        value={heirsAtRisk === null ? "—" : fmtNumber(heirsAtRisk, locale)}
        hint={labels.heirsNoBundleHint}
        emphasis={(heirsAtRisk ?? 0) > 0}
      />
    </div>
  )
}
