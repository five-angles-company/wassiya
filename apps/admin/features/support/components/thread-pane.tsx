"use client"

import { useEffect } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useMutation, useQuery } from "convex/react"
import { ShieldAlertIcon } from "lucide-react"

import { IfPermitted } from "@/components/permission-gate"
import { useLocale } from "@/components/locale-provider"
import { ReplyComposer } from "@/features/support/components/reply-composer"
import { ThreadContext } from "@/features/support/components/thread-context"
import { ThreadMessages } from "@/features/support/components/thread-messages"
import { statusLabel, statusVariant, topicLabel } from "@/features/support/lib/labels"
import { SUPPORT } from "@/features/support/strings/support"
import { fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"

export function ThreadPane({ threadId }: { threadId: Id<"supportThreads"> }) {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const thread = useQuery(api.support.admin.adminThread, { threadId })
  const markRead = useMutation(api.support.admin.adminMarkRead)

  const unread = thread?.unread === true
  useEffect(() => {
    if (unread) void markRead({ threadId })
  }, [unread, threadId, markRead])

  if (thread === undefined) {
    return <Skeleton className="h-full min-h-64 w-full rounded-xl" />
  }
  if (thread === null) {
    return (
      <div className="flex items-center justify-center rounded-xl border text-sm text-muted-foreground">
        {labels.notFound}
      </div>
    )
  }

  return (
    <div className="grid min-h-0 gap-4 xl:grid-cols-[1fr_300px]">
      <div className="flex min-h-0 flex-col rounded-xl border bg-card">
        <header className="flex flex-wrap items-center gap-2 border-b p-3">
          <h2 className="font-heading text-base font-semibold">
            {thread.requester.name ?? thread.requester.email ?? "—"}
          </h2>
          <Badge variant={statusVariant(thread.status)}>
            {statusLabel(thread.status, locale)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {topicLabel(thread.topic, locale)} ·{" "}
            {labels.opened.replace("{date}", fmtDate(thread.createdAt, locale))}
          </span>
        </header>

        <div className="flex items-start gap-2 border-b bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <ShieldAlertIcon className="mt-0.5 size-3.5 shrink-0" />
          <span>{labels.guardrail}</span>
        </div>

        <ThreadMessages threadId={threadId} filesPurged={thread.filesPurged} />

        <IfPermitted need="support.reply">
          <ReplyComposer threadId={threadId} />
        </IfPermitted>
      </div>

      <ThreadContext thread={thread} />
    </div>
  )
}
