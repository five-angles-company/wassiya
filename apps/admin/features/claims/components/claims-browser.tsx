"use client"

import { useState } from "react"
import Link from "next/link"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
import { useQuery } from "convex/react"
import { InboxIcon } from "lucide-react"

import { TableCard } from "@/components/table-card"
import { useLocale } from "@/components/locale-provider"
import { IdentityBadge } from "@/features/claims/components/identity-badge"
import {
  CLAIM_STATUSES,
  claimStatusLabel,
  type ClaimStatus,
} from "@/features/claims/lib/status"
import { CLAIMS } from "@/features/claims/strings/claims"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { fmtDate, fmtNumber, fmtTally } from "@/lib/format"

/**
 * The claims workspace: every status, not just the reviewable one.
 *
 * The dashboard's preview reads `claims.pendingReview`, which is `submitted`-only
 * — and that single fact is what made review unusable. An admin who ruled on a
 * claim watched it leave the only admin query that returns a claim id, with no
 * way back to it. This browser exists so acting on a claim does not lose it.
 *
 * Counts on the chips come from `admin.overview`, which already tallies all six
 * from the same index; `claimsByStatus` returns rows and nothing else.
 */
export function ClaimsBrowser() {
  const locale = useLocale()
  const labels = t(CLAIMS, locale)
  const common = t(COMMON, locale)
  const [status, setStatus] = useState<ClaimStatus>("submitted")

  const overview = useQuery(api.admin.overview)
  const page = useQuery(api.admin.claimsByStatus, { status })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {CLAIM_STATUSES.map((option) => {
          const active = option === status
          const tally = overview?.claims[option]
          return (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={active ? "secondary" : "outline"}
              onClick={() => setStatus(option)}
              className={cn(!active && "text-muted-foreground")}
            >
              {claimStatusLabel(option, locale)}
              {tally !== undefined && (
                <span className="tabular-nums opacity-70">
                  {fmtTally(tally, locale)}
                </span>
              )}
            </Button>
          )
        })}
      </div>

      {page === undefined ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <TableCard
          title={claimStatusLabel(status, locale)}
          footnote={
            page.more
              ? common.showingOf
                  .replace("{n}", fmtNumber(page.rows.length, locale))
                  .replace("{total}", `${fmtNumber(page.pageSize, locale)}+`)
              : undefined
          }
        >
          {page.rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
              <InboxIcon className="size-6 text-muted-foreground" />
              <p className="font-medium">{labels.empty}</p>
              <p className="text-sm text-muted-foreground">
                {labels.emptyHint}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">
                      {labels.colClaimant}
                    </TableHead>
                    <TableHead className="text-start">
                      {labels.colIdentity}
                    </TableHead>
                    <TableHead className="text-start">
                      {labels.colOwner}
                    </TableHead>
                    <TableHead className="text-start">
                      {labels.colHeir}
                    </TableHead>
                    <TableHead className="text-start">
                      {labels.colSubmitted}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {page.rows.map((row) => (
                    <TableRow key={row.id} className="cursor-pointer">
                      <TableCell>
                        <Link
                          href={`/claims/${row.id}`}
                          className="flex flex-col hover:underline"
                        >
                          <span className="font-medium">
                            {row.claimantName}
                          </span>
                          <span
                            dir="ltr"
                            className="inline-block text-xs text-muted-foreground"
                          >
                            {row.claimantContact}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <IdentityBadge
                          status={row.claimantIdentityStatus}
                          locale={locale}
                        />
                      </TableCell>
                      <TableCell>
                        {row.subjectVerifiedName ?? labels.ownerNameNone}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={row.heirLinked ? "secondary" : "outline"}
                          className="whitespace-nowrap"
                        >
                          {row.heirLinked
                            ? labels.heirLinked
                            : labels.heirNotLinked}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {fmtDate(row.submittedAt, locale)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TableCard>
      )}
    </div>
  )
}
