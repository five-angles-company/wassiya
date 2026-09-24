import { CompassIcon } from "lucide-react"

import { ButtonLink } from "@/components/button"
import { NoticeCard } from "@/components/notice-card"
import { PageColumn } from "@/components/page-column"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { COMMON } from "@/lib/i18n/strings/common"

export default async function NotFound() {
  const labels = t(COMMON, await getLocale())

  return (
    <PageColumn>
      <NoticeCard
        icon={CompassIcon}
        title={labels.routeMissingTitle}
        body={labels.routeMissingBody}
        headingLevel="h1"
        action={
          <ButtonLink href="/" variant="outline">
            {labels.backHome}
          </ButtonLink>
        }
      />
    </PageColumn>
  )
}
