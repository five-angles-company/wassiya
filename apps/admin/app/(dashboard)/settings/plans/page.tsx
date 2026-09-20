import { cookies } from "next/headers"

import { RequirePermission } from "@/components/permission-gate"
import { PlansPanel } from "@/features/settings/components/plans-panel"
import { SETTINGS } from "@/features/settings/strings/settings"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/** Thin, like every route here. */
export default async function Page() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(SETTINGS, locale)

  return (
    <RequirePermission need="settings.read">
      <>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {labels.titlePlans}
        </h1>
        <p className="-mt-4 max-w-3xl text-sm text-muted-foreground">
          {labels.introPlans}
        </p>
        <PlansPanel />
      </>
    </RequirePermission>
  )
}
