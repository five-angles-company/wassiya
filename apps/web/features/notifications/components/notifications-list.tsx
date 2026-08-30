"use client"

import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { usePaginatedQuery, useMutation } from "convex/react"
import { BellIcon } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { useLocale } from "@/components/locale-provider"
import { fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { NOTIFICATIONS } from "@/features/notifications/strings/notifications"

const PAGE = 25

/**
 * The feed.
 *
 * ## The unknown kind is a first-class case
 *
 * `kind` is a free `v.string()` in the schema and this app is not its only
 * writer — `checkin.*` and `recovery.*` are written for owners, who read them
 * on mobile but share one user record with this app. A kind with no entry in
 * the dictionary renders its own token in a monospace run, so a gap looks like
 * a gap rather than like a broken row.
 *
 * ## Marking read is a click, never a scroll
 *
 * The rule from the check-in design holds here: a notification reports and
 * navigates, it never confirms. Auto-marking on view would make "read" mean
 * "was on screen", which is exactly the ambiguity that rule exists to prevent —
 * and on this feed the unread set is what the rail's badge counts.
 */
export function NotificationsList() {
  const locale = useLocale()
  const labels = t(NOTIFICATIONS, locale)
  const markRead = useMutation(api.notifications.markRead)
  const { results, status, loadMore } = usePaginatedQuery(
    api.notifications.list,
    {},
    { initialNumItems: PAGE }
  )

  if (status === "LoadingFirstPage") {
    return <div className="bg-card rounded-card h-40 animate-pulse" aria-hidden />
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon={BellIcon}
        title={labels.emptyTitle}
        body={labels.emptyBody}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {results.map((row) => {
        const copy = COPY[row.kind] ?? kindPrefixCopy(row.kind)
        const unread = row.readAt === undefined
        return (
          <article
            key={row._id}
            className={`rounded-card flex flex-wrap items-start gap-4 p-4 md:p-5 ${
              unread ? "bg-accent text-accent-foreground" : "bg-card"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-[15.5px] font-extrabold">
                  {copy === null ? labels.unknownKind : labels[copy.title]}
                </h2>
                {unread && (
                  <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold">
                    {labels.unread}
                  </span>
                )}
              </div>
              <p
                className={`mt-1.5 text-[14px] leading-[1.65] ${
                  unread ? "opacity-80" : "text-muted-foreground"
                }`}
              >
                {copy === null ? (
                  <span dir="ltr" className="font-mono text-[12.5px]">
                    {row.kind}
                  </span>
                ) : (
                  labels[copy.body]
                )}
              </p>
              <p
                className={`mt-2 text-[12.5px] ${unread ? "opacity-60" : "text-muted-foreground"}`}
              >
                {fmtDate(new Date(row._creationTime), locale)}
              </p>
            </div>

            {unread && (
              <button
                type="button"
                onClick={() => {
                  void markRead({
                    notificationId: row._id as Id<"notifications">,
                  })
                }}
                className="shrink-0 rounded-full border border-[color:currentColor] px-4 py-2 text-[13px] font-semibold"
              >
                {labels.markRead}
              </button>
            )}
          </article>
        )
      })}

      {status === "CanLoadMore" && (
        <button
          type="button"
          onClick={() => loadMore(PAGE)}
          className="border-border hover:bg-muted self-start rounded-full border px-6 py-2.5 text-[14px] font-semibold transition-colors"
        >
          {labels.loadMore}
        </button>
      )}
    </div>
  )
}

type Copy = { title: keyof typeof NOTIFICATIONS; body: keyof typeof NOTIFICATIONS }

const COPY: Record<string, Copy> = {
  "claim.submitted": { title: "claimSubmitted", body: "claimSubmittedBody" },
  "claim.blocked_by_lockout": { title: "claimBlocked", body: "claimBlockedBody" },
  "claim.veto_window_open": { title: "claimVetoOpen", body: "claimVetoOpenBody" },
  "claim.vetoed": { title: "claimVetoed", body: "claimVetoedBody" },
  "claim.guardian_review": {
    title: "claimGuardianReview",
    body: "claimGuardianReviewBody",
  },
  "claim.released": { title: "claimReleased", body: "claimReleasedBody" },
  "recovery.attempted": { title: "recovery", body: "recoveryBody" },
}

/**
 * `checkin.*` is a family, not a kind: the escalation state is part of the
 * token (`checkin.day7`, `checkin.countdown`, …). One entry covers all of them,
 * because on this surface the answer is the same for every one — the
 * confirmation is biometric and lives in the phone app.
 */
function kindPrefixCopy(kind: string): Copy | null {
  return kind.startsWith("checkin.")
    ? { title: "checkin", body: "checkinBody" }
    : null
}
