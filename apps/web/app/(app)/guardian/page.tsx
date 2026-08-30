import { PageHeader } from "@/components/page-header"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { DutiesList } from "@/features/guardian/components/duties-list"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

export default async function GuardianPage() {
  const labels = t(GUARDIAN_DUTIES, await getLocale())

  return (
    <>
      <PageHeader title={labels.title} description={labels.body} />
      <DutiesList />
    </>
  )
}
