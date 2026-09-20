import { cookies } from "next/headers"

import { RequirePermission } from "@/components/permission-gate"
import { FillScreen } from "@/components/fill-screen"
import { JobsTable } from "@/features/jobs/components/jobs-table"
import { JOBS } from "@/features/jobs/strings/jobs"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/** Thin, like every route here. */
export default async function Page() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(JOBS, locale)

  return (
    <RequirePermission need="jobs.read">
      <FillScreen>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {labels.pageTitle}
        </h1>
        <p className="-mt-4 max-w-3xl text-sm text-muted-foreground">
          {labels.intro}
        </p>
        <JobsTable />
      </FillScreen>
    </RequirePermission>
  )
}
