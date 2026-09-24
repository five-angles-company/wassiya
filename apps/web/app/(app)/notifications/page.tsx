import { DocTitle } from "@/components/doc/title"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { NotificationsList } from "@/features/notifications/components/notifications-list"
import { NOTIFICATIONS } from "@/features/notifications/strings/notifications"

export default async function NotificationsPage() {
  const labels = t(NOTIFICATIONS, await getLocale())

  return (
    <div className="flex flex-col gap-8">
      <DocTitle title={labels.title} lead={labels.body} />
      <NotificationsList />
    </div>
  )
}
