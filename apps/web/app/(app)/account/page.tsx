import Link from "next/link"
import { ArrowLeftIcon, BellIcon } from "lucide-react"

import { DocTitle } from "@/components/doc/title"
import { IconDisc } from "@/components/icon-disc"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { AccountPanel } from "@/features/account/components/account-panel"
import { ACCOUNT } from "@/features/account/strings/account"

export default async function AccountPage() {
  const labels = t(ACCOUNT, await getLocale())

  return (
    <div className="flex flex-col gap-8">
      <DocTitle title={labels.title} lead={labels.body} />
      <AccountPanel />
      {/* The feed has no bell in the header; this and the account menu are its doors. */}
      <Link
        href="/notifications"
        className="group border-border bg-card/60 hover:bg-card rounded-card flex items-center gap-4 border p-5 transition-colors"
      >
        <IconDisc icon={BellIcon} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="font-heading block text-[16px] font-bold">{labels.notificationsLink}</span>
          <span className="text-muted-foreground mt-0.5 block text-[13.5px]">{labels.notificationsBody}</span>
        </span>
        <ArrowLeftIcon aria-hidden className="nudge text-muted-foreground size-5 shrink-0 ltr:rotate-180" strokeWidth={2.2} />
      </Link>
    </div>
  )
}
