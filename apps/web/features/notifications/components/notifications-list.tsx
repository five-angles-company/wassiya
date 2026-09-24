"use client"

import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { usePaginatedQuery, useMutation } from "convex/react"
import {
  BadgeCheckIcon,
  BellIcon,
  BellOffIcon,
  FileTextIcon,
  HeartPulseIcon,
  HourglassIcon,
  InboxIcon,
  KeyRoundIcon,
  ShieldOffIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/button"
import { Paper } from "@/components/doc/paper"
import { EmptyState } from "@/components/empty-state"
import { IconDisc } from "@/components/icon-disc"
import { useLocale } from "@/components/locale-provider"
import { Placeholder } from "@/components/placeholder"
import { fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { NOTIFICATIONS } from "@/features/notifications/strings/notifications"

const PAGE = 25

/** Read only when clicked, never on scroll: "new" has to mean the reader hasn't acted on it. */
export function NotificationsList() {
  const locale = useLocale()
  const labels = t(NOTIFICATIONS, locale)
  const common = t(COMMON, locale)
  const markRead = useMutation(api.notifications.markRead)
  const { results, status, loadMore } = usePaginatedQuery(api.notifications.list, {}, { initialNumItems: PAGE })

  if (status === "LoadingFirstPage") return <Placeholder label={common.loading} className="h-72" />

  if (results.length === 0) {
    return <EmptyState icon={BellOffIcon} title={labels.emptyTitle} body={labels.emptyBody} />
  }

  return (
    <div className="flex flex-col gap-6">
      <Paper className="rise-in">
        <div className="divide-border divide-y">
          {results.map((row) => {
            const copy = COPY[row.kind] ?? kindPrefixCopy(row.kind)
            const unread = row.readAt === undefined
            return (
              <article key={row._id} className="flex flex-wrap items-start gap-4 px-5 py-5 md:px-6">
                <IconDisc icon={copy?.icon ?? BellIcon} tone={unread ? "attention" : "quiet"} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-[16.5px] font-extrabold">
                      {copy === null ? labels.unknownKind : labels[copy.title]}
                    </h2>
                    {/* A word, not a badge. */}
                    {unread && <span className="text-tone-attention text-[13px] font-bold">{labels.unread}</span>}
                  </div>
                  <p className="text-foreground/75 mt-1.5 text-[14.5px] leading-[1.7]">
                    {copy === null ? (
                      <span dir="ltr" className="font-mono text-[12.5px]">
                        {row.kind}
                      </span>
                    ) : (
                      labels[copy.body]
                    )}
                  </p>
                  <p className="text-muted-foreground mt-2 text-[13px]">{fmtDate(new Date(row._creationTime), locale)}</p>
                </div>
                {unread && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void markRead({ notificationId: row._id as Id<"notifications"> })}
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
        <Button variant="outline" className="self-start" onClick={() => loadMore(PAGE)}>
          {labels.loadMore}
        </Button>
      )}
    </div>
  )
}

type Copy = { title: keyof typeof NOTIFICATIONS; body: keyof typeof NOTIFICATIONS; icon: LucideIcon }

const COPY: Record<string, Copy> = {
  "claim.submitted": { title: "claimSubmitted", body: "claimSubmittedBody", icon: HeartPulseIcon },
  "claim.blocked_by_lockout": { title: "claimBlocked", body: "claimBlockedBody", icon: ShieldOffIcon },
  "claim.veto_window_open": { title: "claimVetoOpen", body: "claimVetoOpenBody", icon: HourglassIcon },
  "claim.vetoed": { title: "claimVetoed", body: "claimVetoedBody", icon: ShieldOffIcon },
  "claim.released": { title: "claimReleased", body: "claimReleasedBody", icon: UsersIcon },
  "claim.filed": { title: "claimFiled", body: "claimFiledBody", icon: InboxIcon },
  "claim.certificate_received": { title: "claimCertificate", body: "claimCertificateBody", icon: FileTextIcon },
  "claim.identity_verified": { title: "claimIdentity", body: "claimIdentityBody", icon: BadgeCheckIcon },
  "claim.in_review": { title: "claimInReview", body: "claimInReviewBody", icon: HourglassIcon },
  "claim.review_failed": { title: "claimReviewFailed", body: "claimReviewFailedBody", icon: ShieldOffIcon },
  "recovery.attempted": { title: "recovery", body: "recoveryBody", icon: KeyRoundIcon },
}

function kindPrefixCopy(kind: string): Copy | null {
  return kind.startsWith("checkin.") ? { title: "checkin", body: "checkinBody", icon: HeartPulseIcon } : null
}
