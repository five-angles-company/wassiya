import { cookies } from "next/headers"

import { RequirePermission } from "@/components/permission-gate"
import { HelpArticles } from "@/features/support/components/help-articles"
import { SUPPORT } from "@/features/support/strings/support"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/** Thin, like every route here. */
export default async function Page() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(SUPPORT, locale)

  return (
    <RequirePermission need="support.read">
      <>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {labels.helpTitle}
        </h1>
        <HelpArticles />
      </>
    </RequirePermission>
  )
}
