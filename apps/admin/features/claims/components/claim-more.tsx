"use client"

import { useState } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { ChevronDownIcon } from "lucide-react"

import { ClaimExecutors } from "@/features/claims/components/claim-executors"
import { ClaimFact } from "@/features/claims/components/claim-fact"
import { ClaimHistory } from "@/features/claims/components/claim-history"
import { ClaimOwner } from "@/features/claims/components/claim-owner"
import { ClaimReporter } from "@/features/claims/components/claim-reporter"
import type { ClaimDetail } from "@/features/claims/lib/detail"
import { CLAIMS } from "@/features/claims/strings/claims"
import { t, type Locale } from "@/lib/i18n/locale"

/** Who is involved and what has happened, folded under the review. */
export function ClaimMore({
  detail,
  locale,
  centered = false,
}: {
  detail: ClaimDetail
  locale: Locale
  /** Under a centred note: the toggle centres, the opened list stays aligned. */
  centered?: boolean
}) {
  const labels = t(CLAIMS, locale)
  const [open, setOpen] = useState(false)
  const { claim, subject } = detail

  return (
    <div className={cn("flex flex-col", centered && "w-full")}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-1.5 py-2.5 text-sm font-semibold text-foreground/80 hover:text-foreground",
          centered ? "self-center" : "self-start"
        )}
      >
        {open ? labels.detailsHide : labels.detailsOpen}
        <ChevronDownIcon
          className={cn("size-4 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && (
        <dl className="flex flex-col divide-y divide-dashed pb-2 text-start">
          <ClaimReporter detail={detail} locale={locale} />
          <ClaimOwner
            subject={subject}
            matchedBy={claim.matchedBy}
            locale={locale}
          />
          {subject.id !== null && (
            <ClaimExecutors executors={detail.executors} locale={locale} />
          )}
          <ClaimFact label={labels.historyTitle}>
            <ClaimHistory history={detail.history} locale={locale} />
          </ClaimFact>
        </dl>
      )}
    </div>
  )
}
