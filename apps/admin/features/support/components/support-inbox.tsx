"use client"

import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { Id } from "@workspace/backend/dataModel"

import { useLocale } from "@/components/locale-provider"
import { ThreadList, type InboxView } from "@/features/support/components/thread-list"
import { ThreadPane } from "@/features/support/components/thread-pane"
import { SUPPORT } from "@/features/support/strings/support"
import { t } from "@/lib/i18n/locale"

const VIEWS: readonly InboxView[] = [
  "open",
  "mine",
  "unassigned",
  "waiting",
  "resolved",
  "all",
]

/**
 * The inbox: a list and the open conversation side by side. View, search and
 * the open thread live in the URL so a thread can be linked to a colleague.
 */
export function SupportInbox() {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const rawView = params.get("view")
  const view: InboxView = VIEWS.includes(rawView as InboxView)
    ? (rawView as InboxView)
    : "open"
  const search = params.get("q") ?? ""
  const threadId = params.get("thread")

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") next.delete(key)
        else next.set(key, value)
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [params, pathname, router]
  )

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[360px_1fr]">
      <ThreadList
        view={view}
        search={search}
        selected={threadId}
        onView={(next) => update({ view: next })}
        onSearch={(next) => update({ q: next })}
        onSelect={(id) => update({ thread: id })}
      />
      {threadId === null ? (
        <div className="hidden items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground lg:flex">
          {labels.pickThread}
        </div>
      ) : (
        <ThreadPane key={threadId} threadId={threadId as Id<"supportThreads">} />
      )}
    </div>
  )
}
