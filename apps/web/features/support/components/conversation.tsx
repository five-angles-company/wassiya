"use client"

import { useEffect } from "react"
import Link from "next/link"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { useMutation, useQuery } from "convex/react"
import { ArrowRightIcon, MessagesSquareIcon } from "lucide-react"

import { Paper } from "@/components/doc/paper"
import { DocTitle } from "@/components/doc/title"
import { useLocale } from "@/components/locale-provider"
import { NoticeCard } from "@/components/notice-card"
import { Placeholder } from "@/components/placeholder"
import { COMMON } from "@/lib/i18n/strings/common"
import { Composer } from "@/features/support/components/composer"
import { MessageList } from "@/features/support/components/message-list"
import { topicLabel } from "@/features/support/lib/topics"
import { useSupportIdentity } from "@/features/support/lib/use-support-identity"
import { SUPPORT } from "@/features/support/strings/support"
import { t } from "@/lib/i18n/locale"

/** `/help/chat/[id]`: one conversation, live. */
export function Conversation({ threadId }: { threadId: string }) {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const identity = useSupportIdentity()
  const id = threadId as Id<"supportThreads">
  const thread = useQuery(
    api.support.threads.thread,
    identity.ready ? { threadId: id, guestToken: identity.guestToken } : "skip"
  )
  const markRead = useMutation(api.support.threads.markRead)

  const unread = thread?.unread === true
  useEffect(() => {
    if (unread) void markRead({ threadId: id, guestToken: identity.guestToken })
  }, [unread, id, identity.guestToken, markRead])

  const back = (
    <Link
      href="/help/chat"
      className="border-border bg-card/60 hover:bg-card inline-flex h-10 w-fit items-center gap-2 rounded-full border px-4 text-[14px] font-semibold transition-colors"
    >
      <ArrowRightIcon className="size-4 ltr:rotate-180" strokeWidth={2.4} aria-hidden />
      {labels.backToList}
    </Link>
  )

  if (!identity.ready || thread === undefined) {
    return <Placeholder label={t(COMMON, locale).loading} className="h-96" />
  }
  if (thread === null) {
    return <NoticeCard icon={MessagesSquareIcon} title={labels.backToList} body={labels.notFound} headingLevel="h1" action={back} />
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start gap-5">
        {back}
        <DocTitle title={topicLabel(thread.topic, locale)} />
      </div>

      <MessageList
        threadId={id}
        guestToken={identity.guestToken}
        filesPurged={thread.filesPurged}
      />

      {thread.status === "resolved" && (
        <p className="text-muted-foreground bg-foreground/[0.04] rounded-row px-4 py-3 text-[14px]">{labels.closedNote}</p>
      )}
      <Paper padded className="rise-in">
        <Composer threadId={id} guestToken={identity.guestToken} />
      </Paper>
    </div>
  )
}
