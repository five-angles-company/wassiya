"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowUpRightIcon } from "lucide-react"

import { ClaimFact } from "@/features/claims/components/claim-fact"
import type { ClaimDetail } from "@/features/claims/lib/detail"
import { CLAIMS } from "@/features/claims/strings/claims"
import { usePermissions } from "@/hooks/use-permissions"
import { t, type Locale } from "@/lib/i18n/locale"

export function ClaimOwner({
  subject,
  matchedBy,
  locale,
}: {
  subject: ClaimDetail["subject"]
  matchedBy: ClaimDetail["claim"]["matchedBy"]
  locale: Locale
}) {
  const labels = t(CLAIMS, locale)
  const { has } = usePermissions()

  if (subject.id === null) {
    return (
      <ClaimFact label={labels.ownerTitle}>
        <span className="text-muted-foreground">{labels.subjectUnmatched}</span>
        <ArrowLink href="/unmatched">{labels.unmatchedOpen}</ArrowLink>
      </ClaimFact>
    )
  }

  const name = <bdi>{subject.verifiedName ?? subject.name ?? "—"}</bdi>

  return (
    <ClaimFact label={labels.ownerTitle}>
      {has("owners.read") ? (
        <ArrowLink href={`/owners/${subject.id}`}>{name}</ArrowLink>
      ) : (
        <span className="font-medium">{name}</span>
      )}
      {subject.email !== null && (
        <span title={subject.email} className="truncate text-muted-foreground">
          <bdi>{subject.email}</bdi>
        </span>
      )}
      {matchedBy !== null && (
        <span className="text-xs text-muted-foreground">
          {matchedBy === "id_number"
            ? labels.matchedByIdNumber
            : labels.matchedByEmail}
        </span>
      )}
    </ClaimFact>
  )
}

function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 self-start font-medium hover:underline"
    >
      {children}
      <ArrowUpRightIcon className="size-3.5 text-muted-foreground rtl:-scale-x-100" />
    </Link>
  )
}
