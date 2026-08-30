import { PageHeader } from "@/components/page-header"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { NotificationsList } from "@/features/notifications/components/notifications-list"
import { NOTIFICATIONS } from "@/features/notifications/strings/notifications"

export default async function NotificationsPage() {
  const labels = t(NOTIFICATIONS, await getLocale())

  return (
    <>
      <PageHeader title={labels.title} description={labels.body} />
      <NotificationsList />
    </>
  )
}
