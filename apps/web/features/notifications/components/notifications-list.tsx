"use client"

import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { usePaginatedQuery, useMutation } from "convex/react"

import { Button } from "@/components/button"
import { Paper } from "@/components/doc/paper"
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
    return (
      <div className="border-border h-40 animate-pulse border-y" aria-hidden />
    )
  }

  if (results.length === 0) {
    return (
      <EmptyState
        title={labels.emptyTitle}
        body={labels.emptyBody}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Paper>
      <div className="divide-border divide-y">
      {results.map((row) => {
        const copy = COPY[row.kind] ?? kindPrefixCopy(row.kind)
        const unread = row.readAt === undefined
        return (
          <article
            key={row._id}
            className="flex flex-wrap items-start gap-4 px-5 py-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-[15.5px] font-extrabold">
                  {copy === null ? labels.unknownKind : labels[copy.title]}
                </h2>
                {/* A word, not a badge — the one pill left on this screen was
                    the only chip in the product. */}
                {unread && (
                  <span className="text-tone-attention text-[12.5px] font-bold">
                    {labels.unread}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-1.5 text-[14px] leading-[1.65]">
                {copy === null ? (
                  <span dir="ltr" className="font-mono text-[12.5px]">
                    {row.kind}
                  </span>
                ) : (
                  labels[copy.body]
                )}
              </p>
              <p className="text-muted-foreground mt-2 text-[12.5px]">
                {fmtDate(new Date(row._creationTime), locale)}
              </p>
            </div>

            {unread && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void markRead({
                    notificationId: row._id as Id<"notifications">,
                  })
                }}
              >
                {labels.markRead}
              </Button>
            )}
          </article>
        )
      })}
      </div>
      </Paper>

      {status === "CanLoadMore" && (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => loadMore(PAGE)}
        >
          {labels.loadMore}
        </Button>
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
  // The claimant's own six. Before these the heir saw exactly two rows in this
  // feed across a whole claim, both at the very end.
  "claim.filed": { title: "claimFiled", body: "claimFiledBody" },
  "claim.certificate_received": {
    title: "claimCertificate",
    body: "claimCertificateBody",
  },
  "claim.identity_verified": {
    title: "claimIdentity",
    body: "claimIdentityBody",
  },
  "claim.in_review": { title: "claimInReview", body: "claimInReviewBody" },
  "claim.review_failed": {
    title: "claimReviewFailed",
    body: "claimReviewFailedBody",
  },
  "claim.guardian_confirmed": {
    title: "claimGuardianConfirmed",
    body: "claimGuardianConfirmedBody",
  },
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
