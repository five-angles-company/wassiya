import { Suspense } from "react"
import type { Metadata } from "next"
import { MessagesSquareIcon } from "lucide-react"

import { DocTitle } from "@/components/doc/title"
import { SupportHome } from "@/features/support/components/support-home"
import { SUPPORT } from "@/features/support/strings/support"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function SupportChatPage() {
  const labels = t(SUPPORT, await getLocale())
  return (
    <div className="flex flex-col gap-8">
      <DocTitle eyebrow={labels.contactTitle} eyebrowIcon={MessagesSquareIcon} title={labels.chatTitle} lead={labels.chatIntro} />
      <Suspense>
        <SupportHome />
      </Suspense>
    </div>
  )
}
