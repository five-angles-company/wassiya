import { PageHeader } from "@/components/page-header"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { AccountPanel } from "@/features/account/components/account-panel"
import { ACCOUNT } from "@/features/account/strings/account"

export default async function AccountPage() {
  const labels = t(ACCOUNT, await getLocale())

  return (
    <>
      <PageHeader title={labels.title} description={labels.body} />
      <AccountPanel />
    </>
  )
}
