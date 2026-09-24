import { Suspense } from "react"
import { cookies } from "next/headers"

import { FillScreen } from "@/components/fill-screen"
import { RequirePermission } from "@/components/permission-gate"
import { SupportInbox } from "@/features/support/components/support-inbox"
import { SUPPORT } from "@/features/support/strings/support"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/** Thin, like every route here. */
export default async function Page() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(SUPPORT, locale)

  return (
    <RequirePermission need="support.read">
      <FillScreen>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {labels.pageTitle}
        </h1>
        <Suspense>
          <SupportInbox />
        </Suspense>
      </FillScreen>
    </RequirePermission>
  )
}
