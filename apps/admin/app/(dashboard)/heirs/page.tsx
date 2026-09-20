import { cookies } from "next/headers"

import { RequirePermission } from "@/components/permission-gate"
import { FillScreen } from "@/components/fill-screen"
import { HeirsBrowser } from "@/features/heirs/components/heirs-browser"
import { HEIRS } from "@/features/heirs/strings/heirs"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/** Thin, like every route here. */
export default async function Page() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(HEIRS, locale)

  return (
    <RequirePermission need="owners.read">
      <FillScreen>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {labels.pageTitle}
        </h1>
        <HeirsBrowser />
      </FillScreen>
    </RequirePermission>
  )
}
