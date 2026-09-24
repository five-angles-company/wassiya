import { LifeBuoyIcon } from "lucide-react"

import { DocTitle } from "@/components/doc/title"
import { HelpCenter } from "@/features/support/components/help-center"
import { SUPPORT } from "@/features/support/strings/support"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"

export default async function HelpPage() {
  const labels = t(SUPPORT, await getLocale())
  return (
    <div className="flex flex-col gap-8">
      <DocTitle eyebrow={labels.helpTitle} eyebrowIcon={LifeBuoyIcon} title={labels.questions} lead={labels.helpIntro} />
      <HelpCenter />
    </div>
  )
}
