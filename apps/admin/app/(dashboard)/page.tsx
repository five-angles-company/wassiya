import { cookies } from "next/headers"

import { RequirePermission } from "@/components/permission-gate"
import {
  ActivationFunnel,
  SignupsChart,
  StoragePanel,
} from "@/features/dashboard/components/charts"
import { ClaimsQueue } from "@/features/claims/components/claims-queue"
import { RiskSection } from "@/features/dashboard/components/risk-section"
import { SummaryBar } from "@/features/dashboard/components/summary-bar"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"
import { DASHBOARD } from "@/features/dashboard/strings/dashboard"

/**
 * The operations console. One page, full-width panels, four numbers at the top.
 *
 * The length problem was never the arrangement — tabs and a two-column grid were
 * both tried — it was the volume. Four numbers in a plain row instead of eleven
 * boxes, bare panel titles with no descriptions, five rows per table, and every
 * panel full width where it has room to be read.
 *
 * A Server Component for the heading, with every live region a client leaf
 * holding its own Convex subscription — which is what keeps the two scanning
 * queries (`risk`, `storage`) from delaying the indexed one the page opens with.
 */
export default async function DashboardPage() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(DASHBOARD, locale)

  return (
    <RequirePermission need="dashboard.read">
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
    </RequirePermission>
  )
}
