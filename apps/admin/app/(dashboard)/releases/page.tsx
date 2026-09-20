import { cookies } from "next/headers"

import { RequirePermission } from "@/components/permission-gate"
import { FillScreen } from "@/components/fill-screen"
import { ReleasesTable } from "@/features/releases/components/releases-table"
import { RELEASES } from "@/features/releases/strings/releases"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/** Thin, like every route here. */
export default async function Page() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(RELEASES, locale)

  return (
    <RequirePermission need="claims.read">
      <FillScreen>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {labels.pageTitle}
        </h1>
        <p className="-mt-4 max-w-3xl text-sm text-muted-foreground">
          {labels.intro}
        </p>
        <ReleasesTable />
      </FillScreen>
    </RequirePermission>
  )
}
