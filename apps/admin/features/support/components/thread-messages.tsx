"use client"

import { useEffect, useRef } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { usePaginatedQuery } from "convex/react"
import { PaperclipIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { SUPPORT } from "@/features/support/strings/support"
import { fmtBytes } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

const TIME = { hour: "2-digit", minute: "2-digit" } as const

function fmtStamp(at: number, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-GB", {
    day: "numeric",
    month: "short",
    ...TIME,
  }).format(new Date(at))
}

/** The conversation, oldest at the top, pinned to the newest message. */
export function ThreadMessages({
  threadId,
  filesPurged,
}: {
  threadId: Id<"supportThreads">
  filesPurged: boolean
}) {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const { results, status, loadMore } = usePaginatedQuery(
    api.support.admin.adminMessages,
    { threadId },
    { initialNumItems: 40 }
  )
  const bottom = useRef<HTMLDivElement>(null)
  const newest = results[0]?.id

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" })
  }, [newest])

  const messages = [...results].reverse()

  return (
    <div className="min-h-64 flex-1 overflow-y-auto p-3">
      {status === "CanLoadMore" && (
        <div className="mb-3 flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => loadMore(40)}>
            {labels.loadOlder}
          </Button>
        </div>
      )}
      {status === "LoadingFirstPage" && <Skeleton className="h-24 w-2/3" />}
      {filesPurged && (
        <p className="mb-3 text-center text-xs text-muted-foreground">
          {labels.filesPurged}
        </p>
      )}
      <ol className="flex flex-col gap-3">
        {messages.map((message) => {
          const staff = message.author === "staff"
          return (
            <li
              key={message.id}
              className={cn(
                "flex max-w-[80%] flex-col gap-1",
                staff ? "self-end items-end" : "self-start items-start"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                  staff ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                {message.body}
                {message.attachments.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {message.attachments.map((file, index) => (
                      <li key={index}>
                        <a
                          href={file.url ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 underline underline-offset-2"
                        >
                          <PaperclipIcon className="size-3" />
                          {file.name}
                          <span dir="ltr" className="opacity-70">
                            ({fmtBytes(file.size, locale)})
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {staff ? (message.staffName ?? labels.staff) : labels.you} ·{" "}
                {fmtStamp(message.at, locale)}
              </span>
            </li>
          )
        })}
      </ol>
      <div ref={bottom} />
    </div>
  )
}
