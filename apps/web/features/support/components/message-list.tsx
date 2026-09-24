"use client"

import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { usePaginatedQuery } from "convex/react"

import { Button } from "@/components/button"
import { useLocale } from "@/components/locale-provider"
import { SUPPORT } from "@/features/support/strings/support"
import { t, type Locale } from "@/lib/i18n/locale"

function fmtStamp(at: number, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-GB", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(at))
}

/**
 * The conversation, oldest first. Staff messages are signed by the team, never
 * by a person — the backend does not say who replied.
 */
export function MessageList({
  threadId,
  guestToken,
  filesPurged,
}: {
  threadId: Id<"supportThreads">
  guestToken: string | undefined
  filesPurged: boolean
}) {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const { results, status, loadMore } = usePaginatedQuery(
    api.support.threads.messages,
    { threadId, guestToken },
    { initialNumItems: 50 }
  )
  const messages = [...results].reverse()

  return (
    <div className="flex flex-col gap-4">
      {status === "CanLoadMore" && (
        <Button variant="ghost" size="sm" onClick={() => loadMore(50)}>
          {labels.loadOlder}
        </Button>
      )}
      {filesPurged && (
        <p className="text-muted-foreground text-[13px]">{labels.filesPurged}</p>
      )}
      <ol className="flex flex-col gap-4">
        {messages.map((message) => {
          const ours = message.author === "staff"
          return (
            <li
              key={message.id}
              className={
                ours
                  ? "flex max-w-[85%] flex-col items-start gap-1.5 self-start"
                  : "flex max-w-[85%] flex-col items-end gap-1.5 self-end"
              }
            >
              <div
                className={
                  ours
                    ? "bg-card border-border rounded-[22px] rounded-ss-md border px-5 py-3.5 text-[15.5px] leading-[1.75] whitespace-pre-wrap shadow-[var(--shadow-raised)]"
                    : "bg-primary text-primary-foreground rounded-[22px] rounded-se-md px-5 py-3.5 text-[15.5px] leading-[1.75] whitespace-pre-wrap shadow-[var(--shadow-raised)]"
                }
              >
                {message.body}
                {message.attachments.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1 text-[13.5px]">
                    {message.attachments.map((file, index) => (
                      <li key={index}>
                        <a
                          href={file.url ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="underline underline-offset-4"
                        >
                          {file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <span className="text-muted-foreground px-1 text-[12.5px]">
                {ours ? labels.us : labels.you} · {fmtStamp(message.at, locale)}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
