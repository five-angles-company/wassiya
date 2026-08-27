import { cookies } from "next/headers"

import { ActivationFunnel } from "@/features/dashboard/components/activation-funnel"
import { ClaimsQueue } from "@/features/claims/components/claims-queue"
import { RiskSection } from "@/features/dashboard/components/risk-section"
import { SignupsChart } from "@/features/dashboard/components/signups-chart"
import { StoragePanel } from "@/features/dashboard/components/storage-panel"
import { SummaryBar } from "@/features/dashboard/components/summary-bar"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"
import { DASHBOARD } from "@/features/dashboard/strings/dashboard"

/**
 * The operations console. One page, full-width panels, four numbers at the top.
 *
 * ## What this went through, so it does not get re-litigated
 *
 * It started as four stacked sections of tiles and tables and ran to about four
 * screens. Tabs cut the length by hiding three-quarters of it — worse, because
 * the point of an operations board is seeing the shape of things at once. A
 * two-column grid was tried next and squeezed five-column tables into half a
 * laptop's width.
 *
 * What was actually wrong was never the arrangement: it was the volume. Eleven
 * stat cards, a title and a subtitle on every panel, and tables with no row
 * limit. So the fix is subtraction — four numbers in a plain row instead of
 * eleven boxes, bare panel titles with no descriptions, five rows per table, and
 * every panel full width where it has room to be read.
 *
 * ## Server shell, client leaves
 *
 * A Server Component for the heading, with every live region a client leaf
 * holding its own Convex subscription — the repo's established shape, and what
 * keeps the two scanning queries (`risk`, `storage`) from delaying the indexed
 * one the page opens with.
 */
export default async function DashboardPage() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(DASHBOARD, locale)

  return (
    <>
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        {labels.title}
      </h1>

      <SummaryBar />

      <ClaimsQueue />
      <RiskSection />
      <ActivationFunnel />
      <SignupsChart />
      <StoragePanel />
    </>
  )
}
