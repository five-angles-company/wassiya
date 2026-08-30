import { PageHeader } from "@/components/page-header"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { BoxIndex } from "@/features/box/components/box-index"
import { HEIR_BOX } from "@/features/box/strings/heir-box"

export default async function BoxIndexPage() {
  const labels = t(HEIR_BOX, await getLocale())

  return (
    <>
      <PageHeader title={labels.indexTitle} description={labels.indexBody} />
      <BoxIndex />
    </>
  )
}
