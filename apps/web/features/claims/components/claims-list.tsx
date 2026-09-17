"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"
import { FilePlus2Icon, FileTextIcon } from "lucide-react"

import { ActionRow } from "@/components/action-row"
import { ButtonLink } from "@/components/button"
import { ClaimStatusPill } from "@/components/claim-status-pill"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { useLocale } from "@/components/locale-provider"
import { shortRef } from "@/lib/claim-ref"
import { fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { CLAIMS } from "@/features/claims/strings/claims"

/**
 * Every report this person has filed. The screen owns its own header, which is
 * the point: the route used to render `PageHeader` with a "بلاغ جديد" button and
 * then this list, which put the same button a second time inside the empty
 * state. The header belongs to the populated case — on an empty list the button
 * is the only thing to do, so it belongs in the middle of the screen. Deciding
 * that needs the row count, so the whole screen moved in here.
 *
 * `claims.mine` returns no subject name — it is the claimant's own list, keyed
 * on `claimantUserId`, and adding the deceased's name would put a second read on
 * a query the bar runs on every page. So a row is its short reference and its
 * date, and the name appears on the detail page.
 *
 * Rows are `now` only when something is actually being asked of the reader: on
 * this list that is `released`, and nothing else — not the objection period,
 * which by design asks nothing of anyone.
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
        fill
        icon={FileTextIcon}
        title={labels.emptyTitle}
        body={labels.emptyBody}
        hint={labels.timing}
        action={<NewReportButton label={labels.newReport} size="lg" />}
      />
    )
  }

  return (
    <>
      <PageHeader
        title={labels.listTitle}
        description={labels.listBody}
        action={<NewReportButton label={labels.newReport} size="sm" />}
      />

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
    </>
  )
}

/**
 * One button, two sizes.
 *
 * `lg` is the board's 56px primary — the empty screen's single action. `sm` is
 * the header's corner button, which sits beside a title and must not outweigh
 * it.
 */
function NewReportButton({
  label,
  size,
}: {
  label: string
  size: "sm" | "lg"
}) {
  return (
    <ButtonLink href="/claims/new" size={size}>
      <FilePlus2Icon
        className={size === "lg" ? "size-5" : "size-4"}
        strokeWidth={2.4}
        aria-hidden
      />
      {label}
    </ButtonLink>
  )
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <div className="bg-card rounded-card h-16 w-1/3 animate-pulse" />
      {[0, 1].map((row) => (
        <div key={row} className="bg-card rounded-card h-[92px] animate-pulse" />
      ))}
    </div>
  )
}
