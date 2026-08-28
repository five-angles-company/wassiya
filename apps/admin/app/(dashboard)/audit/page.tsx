import { cookies } from "next/headers"

import { AuditLog } from "@/features/audit/components/audit-log"
import { AUDIT } from "@/features/audit/strings/audit"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/** Thin, like every route here. */
export default async function Page() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(AUDIT, locale)

  return (
    <>
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        {labels.pageTitle}
      </h1>
      <AuditLog />
    </>
  )
}
