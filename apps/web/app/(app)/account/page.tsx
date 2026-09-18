import Link from "next/link"

import { DocTitle } from "@/components/doc/title"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { AccountPanel } from "@/features/account/components/account-panel"
import { ACCOUNT } from "@/features/account/strings/account"

/**
 * What this service knows about you — and, now, the way to the notification
 * feed.
 *
 * The bell went with the rest of the chrome: a badge counting a handful of
 * rows, all of which the case page states larger and in context, is a dashboard
 * affordance for a returning user. The feed itself stays, because
 * `notifications.*` is shared with mobile owners whose `checkin.*` and
 * `recovery.*` rows still land in it — and an unlinked route is a deleted one.
 * This page is where somebody already comes to ask what we hold of theirs.
 */
export default async function AccountPage() {
  const labels = t(ACCOUNT, await getLocale())

  return (
    <div className="flex flex-col gap-11">
      <DocTitle title={labels.title} meta={labels.body} />
      <AccountPanel />
      <p className="text-muted-foreground text-[14px]">
        <Link
          href="/notifications"
          className="text-foreground decoration-surface-accent font-semibold underline decoration-2 underline-offset-4"
        >
          {labels.notificationsLink}
        </Link>
      </p>
    </div>
  )
}
