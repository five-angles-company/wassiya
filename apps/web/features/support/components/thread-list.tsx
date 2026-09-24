"use client"

import Link from "next/link"
import { api } from "@workspace/backend/api"
import { usePaginatedQuery } from "convex/react"
import { ChevronLeftIcon, MessageCircleIcon } from "lucide-react"

import { Button } from "@/components/button"
import { Paper } from "@/components/doc/paper"
import { IconDisc } from "@/components/icon-disc"
import { useLocale } from "@/components/locale-provider"
import { statusLabel, topicLabel } from "@/features/support/lib/topics"
import { SUPPORT } from "@/features/support/strings/support"
import { fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"

/** Earlier conversations. Absent, not empty, when there are none — the form below says what to do. */
export function ThreadList({ guestToken }: { guestToken: string | undefined }) {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const { results, status, loadMore } = usePaginatedQuery(api.support.threads.list, { guestToken }, { initialNumItems: 10 })

  if (status === "LoadingFirstPage" || results.length === 0) return null

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-[20px] font-extrabold">{labels.threadsTitle}</h2>
      <Paper className="rise-in">
        <ul className="divide-border divide-y">
          {results.map((thread) => (
            <li key={thread.id}>
              <Link href={`/help/chat/${thread.id}`} className="group hover:bg-foreground/[0.03] flex items-center gap-4 px-5 py-4 md:px-6">
                <IconDisc icon={MessageCircleIcon} tone={thread.unread ? "attention" : "quiet"} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-heading text-[16px] font-extrabold">{topicLabel(thread.topic, locale)}</span>
                    {thread.unread ? (
                      <span className="text-tone-attention text-[13px] font-bold">{labels.newReply}</span>
                    ) : (
                      <span className="text-muted-foreground text-[13px]">{statusLabel(thread.status, locale)}</span>
                    )}
                    <span className="text-muted-foreground ms-auto text-[13px]">{fmtDate(new Date(thread.lastMessageAt), locale)}</span>
                  </div>
                  <p className="text-foreground/70 mt-1 line-clamp-1 text-[14.5px]">{thread.preview}</p>
                </div>
                <ChevronLeftIcon aria-hidden className="nudge text-muted-foreground size-5 shrink-0 ltr:rotate-180" strokeWidth={2.4} />
              </Link>
            </li>
          ))}
        </ul>
      </Paper>
      {status === "CanLoadMore" && (
        <Button variant="outline" size="sm" className="self-start" onClick={() => loadMore(10)}>
          {labels.loadMore}
        </Button>
      )}
    </section>
  )
}
