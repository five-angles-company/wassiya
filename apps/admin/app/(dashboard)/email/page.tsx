import { cookies } from "next/headers"

import { EmailLog } from "@/features/email/components/email-log"
import { EMAIL_LOG } from "@/features/email/strings/email"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/** Thin, like every route here. */
export default async function Page() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(EMAIL_LOG, locale)

  return (
    <>
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        {labels.pageTitle}
      </h1>
      <EmailLog />
    </>
  )
}
