"use client"

import Link from "next/link"
import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"
import { FilePlus2Icon, FileTextIcon } from "lucide-react"

import { ActionRow } from "@/components/action-row"
import { ClaimStatusPill } from "@/components/claim-status-pill"
import { EmptyState } from "@/components/empty-state"
import { useLocale } from "@/components/locale-provider"
import { shortRef } from "@/lib/claim-ref"
import { fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { CLAIMS } from "@/features/claims/strings/claims"

/**
 * Every report this person has filed.
 *
 * `claims.mine` returns no subject name — it is the claimant's own list, keyed
 * on `claimantUserId`, and adding the deceased's name to it would put a second
 * read on a query the sidebar runs on every page. So the row is identified by
 * its short reference and its date, and the name appears on the detail page,
 * which already fetches it.
 *
 * Rows are `now` when something is actually being asked of the reader. On this
 * list that is `released` — a ready box is the one row someone should act on —
 * and nothing else, including the objection period, which by design asks
 * nothing of anybody.
 */
export function ClaimsList() {
  const locale = useLocale()
  const labels = t(CLAIMS, locale)
  const common = t(COMMON, locale)
  const claims = useQuery(api.claims.mine, {})

  if (claims === undefined) return <ListSkeleton />

  if (claims.length === 0) {
    return (
      <EmptyState
        icon={FileTextIcon}
        title={labels.emptyTitle}
        body={labels.emptyBody}
        action={
          <Link
            href="/claims/new"
            className="bg-primary text-primary-foreground hover:bg-terracotta-600 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[14.5px] font-semibold transition-colors"
          >
            <FilePlus2Icon className="size-4" strokeWidth={2.4} aria-hidden />
            {labels.newReport}
          </Link>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {claims.map((claim) => (
        <ActionRow
          key={claim.id}
          href={`/claims/${claim.id}`}
          icon={FileTextIcon}
          tone={claim.status === "released" ? "now" : "quiet"}
          title={shortRef(claim.id)}
          body={`${common.filedOn} ${fmtDate(new Date(claim.submittedAt), locale)}`}
          meta={<ClaimStatusPill status={claim.status} locale={locale} />}
        />
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {[0, 1].map((row) => (
        <div key={row} className="bg-card rounded-card h-[92px] animate-pulse" />
      ))}
    </div>
  )
}
