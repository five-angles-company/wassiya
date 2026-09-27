"use client"

import Link from "next/link"
import { api } from "@workspace/backend/api"
import type { Doc, Id } from "@workspace/backend/dataModel"
import { usePaginatedQuery, useMutation } from "convex/react"
import {
  BadgeCheckIcon,
  BellIcon,
  BellOffIcon,
  ChevronLeftIcon,
  FileTextIcon,
  HeartPulseIcon,
  HourglassIcon,
  InboxIcon,
  KeyRoundIcon,
  MessagesSquareIcon,
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

/**
 * Read only when acted on, never on scroll: "new" has to mean the reader hasn't
 * opened it. A row that is about a report or a conversation opens it, and
 * opening marks it read.
 */
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
            const href = copy === null ? null : destinationOf(row, copy)
            const read = () => {
              if (unread) void markRead({ notificationId: row._id as Id<"notifications"> })
            }
            const title = copy === null ? labels.unknownKind : labels[copy.title]
            return (
              <article
                key={row._id}
                className="relative flex flex-wrap items-start gap-4 px-5 py-5 transition-colors has-[a:hover]:bg-foreground/[0.03] md:px-6"
              >
                <IconDisc icon={copy?.icon ?? BellIcon} tone={unread ? "attention" : "quiet"} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-[16.5px] font-extrabold">
                      {href === null ? (
                        title
                      ) : (
                        // Stretched over the whole row, so the row is one target.
                        <Link href={href} onClick={read} className="after:absolute after:inset-0">
                          {title}
                        </Link>
                      )}
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
                {href !== null ? (
                  <ChevronLeftIcon
                    aria-hidden
                    className="text-muted-foreground mt-2 size-5 shrink-0 ltr:rotate-180"
                    strokeWidth={2.4}
                  />
                ) : (
                  unread && (
                    <Button size="sm" variant="outline" onClick={read}>
                      {labels.markRead}
                    </Button>
                  )
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

/**
 * Where a row leads. Owner kinds lead nowhere on the web: the vault, the
 * check-in and the veto live on the phone, and the row says so.
 */
type Destination = "case" | "thread" | null

type Copy = {
  title: keyof typeof NOTIFICATIONS
  body: keyof typeof NOTIFICATIONS
  icon: LucideIcon
  opens: Destination
}

function destinationOf(row: Doc<"notifications">, copy: Copy): string | null {
  if (copy.opens === "case" && row.claimId !== undefined) return `/case/${row.claimId}`
  const threadId = row.payload.threadId
  if (copy.opens === "thread" && typeof threadId === "string") return `/help/chat/${threadId}`
  return null
}

const COPY: Record<string, Copy> = {
  "claim.filed": { title: "claimFiled", body: "claimFiledBody", icon: InboxIcon, opens: "case" },
  "claim.certificate_received": {
    title: "claimCertificate",
    body: "claimCertificateBody",
    icon: FileTextIcon,
    opens: "case",
  },
  "claim.identity_verified": { title: "claimIdentity", body: "claimIdentityBody", icon: BadgeCheckIcon, opens: "case" },
  "claim.in_review": { title: "claimInReview", body: "claimInReviewBody", icon: HourglassIcon, opens: "case" },
  "claim.review_failed": {
    title: "claimReviewFailed",
    body: "claimReviewFailedBody",
    icon: ShieldOffIcon,
    opens: "case",
  },
  "claim.vetoed": { title: "claimVetoed", body: "claimVetoedBody", icon: ShieldOffIcon, opens: "case" },
  "claim.released": { title: "claimReleased", body: "claimReleasedBody", icon: UsersIcon, opens: "case" },
  "claim.closed": { title: "claimClosed", body: "claimClosedBody", icon: ShieldOffIcon, opens: "case" },
  "support.reply": { title: "supportReply", body: "supportReplyBody", icon: MessagesSquareIcon, opens: "thread" },
  "claim.submitted": { title: "claimSubmitted", body: "claimSubmittedBody", icon: HeartPulseIcon, opens: null },
  "claim.blocked_by_lockout": { title: "claimBlocked", body: "claimBlockedBody", icon: ShieldOffIcon, opens: null },
  "claim.veto_window_open": { title: "claimVetoOpen", body: "claimVetoOpenBody", icon: HourglassIcon, opens: null },
  "recovery.attempted": { title: "recovery", body: "recoveryBody", icon: KeyRoundIcon, opens: null },
}

function kindPrefixCopy(kind: string): Copy | null {
  return kind.startsWith("checkin.")
    ? { title: "checkin", body: "checkinBody", icon: HeartPulseIcon, opens: null }
    : null
}
