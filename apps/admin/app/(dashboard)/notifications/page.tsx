import { cookies } from "next/headers"

import { NotificationsLog } from "@/features/notifications/components/notifications-log"
import { NOTIFICATIONS } from "@/features/notifications/strings/notifications"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/** Thin, like every route here. */
export default async function Page() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(NOTIFICATIONS, locale)

  return (
    <>
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        {labels.pageTitle}
      </h1>
      <NotificationsLog />
    </>
  )
}
