import { cookies } from "next/headers"

import { FillScreen } from "@/components/fill-screen"
import { RequirePermission } from "@/components/permission-gate"
import { RolesTable } from "@/features/staff/components/roles-table"
import { STAFF } from "@/features/staff/strings/staff"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/** Thin, like every route here. */
export default async function Page() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(STAFF, locale)

  return (
    <RequirePermission need="staff.read">
      <FillScreen>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {labels.rolesTitle}
        </h1>
        <p className="-mt-4 max-w-3xl text-sm text-muted-foreground">
          {labels.rolesIntro}
        </p>
        <RolesTable />
      </FillScreen>
    </RequirePermission>
  )
}
