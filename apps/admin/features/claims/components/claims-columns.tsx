"use client"

import Link from "next/link"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import type { FunctionReturnType } from "convex/server"
import { ExternalLinkIcon, MoreHorizontalIcon } from "lucide-react"

import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { IdentityBadge } from "@/components/identity-badge"
import { t, type Locale } from "@/lib/i18n/locale"
import { CLAIMS } from "@/features/claims/strings/claims"
import type { DataTableFeatures } from "@/lib/data-table-features"
import { fmtDate } from "@/lib/format"

/**
 * One row of the review queue, derived from the query rather than restated.
 *
 * `pendingReview` already flattens the claim, resolves the owner's verified
 * name and turns the certificate's storage id into a URL, so widening it later
 * updates this type for free — and narrowing it breaks the build here rather
 * than at runtime in front of a reviewer.
 */
export type PendingClaim = FunctionReturnType<
  typeof api.claims.pendingReview
>[number]

const helper = createColumnHelper<DataTableFeatures, PendingClaim>()

/** Machine strings stay LTR inside Arabic prose — ids, filenames, emails. */
function Machine({ children }: { children: React.ReactNode }) {
  return (
    <span dir="ltr" className="inline-block font-mono text-xs">
      {children}
    </span>
  )
}

export function claimColumns(
  locale: Locale
): ColumnDef<DataTableFeatures, PendingClaim>[] {
  const labels = t(CLAIMS, locale)

  return helper.columns([
    helper.accessor("claimantName", {
      id: "claimantName",
      filterFn: "includesString",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colClaimant} />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.claimantName}</span>
      ),
    }),

    helper.accessor("claimantIdentityStatus", {
      id: "claimantIdentityStatus",
      header: () => labels.colIdentity,
      cell: ({ row }) => (
        <IdentityBadge
          status={row.original.claimantIdentityStatus}
          locale={locale}
        />
      ),
    }),

    helper.accessor("certificateName", {
      id: "certificateName",
      header: () => labels.colCertificate,
      cell: ({ row }) => {
        const { certificateUrl, certificateName } = row.original
        if (certificateUrl === null) {
          return (
            <span className="text-muted-foreground">
              {labels.certificateNone}
            </span>
          )
        }
        return (
          <a
            href={certificateUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLinkIcon className="size-3.5 shrink-0" />
            {certificateName === null ? (
              labels.certificateView
            ) : (
              <Machine>{certificateName}</Machine>
            )}
          </a>
        )
      },
    }),

    // The comparison the reviewer is actually making: this name against the one
    // on the certificate. Never done by string equality in code —
    // `adminSetNameMatch`'s own comment explains that transliteration,
    // honorifics and name order make that unsafe in Arabic. A human reads both.
    helper.accessor("subjectVerifiedName", {
      id: "subjectVerifiedName",
      header: () => labels.colOwner,
      cell: ({ row }) =>
        row.original.subjectVerifiedName ?? (
          <span className="text-muted-foreground">{labels.ownerNameNone}</span>
        ),
    }),

    helper.accessor("submittedAt", {
      id: "submittedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.colSubmitted} />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {fmtDate(row.original.submittedAt, locale)}
        </span>
      ),
    }),

    helper.display({
      id: "actions",
      enableHiding: false,
      header: () => <span className="sr-only">{labels.colActions}</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs">
              <span className="sr-only">{labels.openMenu}</span>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() =>
                  void navigator.clipboard.writeText(row.original.id)
                }
              >
                {labels.actionCopyId}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {/* These were two disabled items and a note saying the review
                  workflow shipped separately. It has now shipped, so they
                  become one link to it — a verdict is made on the review
                  screen, where the certificate and the owner's verified name
                  are side by side, and never from a row in a preview table. */}
              <DropdownMenuItem asChild>
                <Link href={`/claims/${row.original.id}`}>
                  {labels.actionOpen}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ])
}

/** Column id → label, for the visibility menu. */
export function claimColumnLabels(locale: Locale): Record<string, string> {
  const labels = t(CLAIMS, locale)
  return {
    claimantName: labels.colClaimant,
    claimantIdentityStatus: labels.colIdentity,
    certificateName: labels.colCertificate,
    subjectVerifiedName: labels.colOwner,
    submittedAt: labels.colSubmitted,
    actions: labels.colActions,
  }
}
