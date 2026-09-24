"use client"

import { useEffect, useState } from "react"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { usePaginatedQuery } from "convex/react"

import { useLocale } from "@/components/locale-provider"
import { statusLabel, statusVariant, topicLabel } from "@/features/support/lib/labels"
import { SUPPORT } from "@/features/support/strings/support"
import { fmtAgo } from "@/lib/format"
import { t } from "@/lib/i18n/locale"

export type InboxView =
  | "open"
  | "mine"
  | "unassigned"
  | "waiting"
  | "resolved"
  | "all"

const VIEW_KEY = {
  open: "viewOpen",
  mine: "viewMine",
  unassigned: "viewUnassigned",
  waiting: "viewWaiting",
  resolved: "viewResolved",
  all: "viewAll",
} as const satisfies Record<InboxView, keyof typeof SUPPORT>

const SEARCH_DEBOUNCE_MS = 300

export function ThreadList({
  view,
  search,
  selected,
  onView,
  onSearch,
  onSelect,
}: {
  view: InboxView
  search: string
  selected: string | null
  onView: (view: InboxView) => void
  onSearch: (search: string) => void
  onSelect: (threadId: string) => void
}) {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const [draft, setDraft] = useState(search)
  const [now] = useState(() => Date.now())

  useEffect(() => {
    if (draft === search) return
    const timer = setTimeout(() => onSearch(draft), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [draft, search, onSearch])

  const { results, status, loadMore } = usePaginatedQuery(
    api.support.admin.adminInboxPage,
    { view, search },
    { initialNumItems: 30 }
  )

  return (
    <div className="flex min-h-0 flex-col rounded-xl border bg-card">
      <div className="flex flex-col gap-2 border-b p-3">
        <div className="flex flex-wrap gap-1">
          {(Object.keys(VIEW_KEY) as InboxView[]).map((key) => (
            <Button
              key={key}
              size="sm"
              variant={key === view ? "default" : "ghost"}
              onClick={() => onView(key)}
            >
              {labels[VIEW_KEY[key]]}
            </Button>
          ))}
        </div>
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={labels.search}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {status === "LoadingFirstPage" ? (
          <div className="flex flex-col gap-2 p-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {labels.empty}
          </p>
        ) : (
          <ul>
            {results.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => onSelect(row.id)}
                  className={cn(
                    "flex w-full flex-col gap-1 border-b px-3 py-2.5 text-start transition-colors hover:bg-muted/60",
                    selected === row.id && "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {row.unread && (
                      <span className="size-2 shrink-0 rounded-full bg-primary" />
                    )}
                    <span
                      className={cn(
                        "truncate text-sm",
                        row.unread ? "font-semibold" : "font-medium"
                      )}
                    >
                      {row.requester.name ?? row.requester.email ?? "—"}
                    </span>
                    {row.requester.kind === "guest" && (
                      <Badge variant="outline">{labels.guest}</Badge>
                    )}
                    <span className="ms-auto shrink-0 text-xs text-muted-foreground">
                      {fmtAgo(row.lastMessageAt, now, locale)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {row.preview}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={statusVariant(row.status)}>
                      {statusLabel(row.status, locale)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {topicLabel(row.topic, locale)}
                    </span>
                    {row.assigneeName !== null && (
                      <span className="ms-auto truncate text-xs text-muted-foreground">
                        {row.assigneeName}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {status === "CanLoadMore" && (
          <div className="p-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => loadMore(30)}
            >
              {labels.loadMore}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
