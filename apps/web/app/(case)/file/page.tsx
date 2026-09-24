import { ClockIcon } from "lucide-react"

import { DocTitle } from "@/components/doc/title"
import { HelpLink } from "@/components/help-link"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { FileClaimForm } from "@/features/claims/components/file-claim-form"
import { CLAIMS } from "@/features/claims/strings/claims"

/**
 * Report a death. Readable signed out, so what to prepare is visible before
 * anyone is asked to make an account.
 */
export default async function FilePage() {
  const locale = await getLocale()
  const labels = t(CLAIMS, locale)

  return (
    <div className="flex flex-col gap-10">
      <DocTitle eyebrow={labels.timing} eyebrowIcon={ClockIcon} title={labels.newTitle} lead={labels.newIntro} />
      <FileClaimForm />
      <HelpLink locale={locale} topic="claim" />
    </div>
  )
}
