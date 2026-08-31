"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"
import { PackageIcon } from "lucide-react"

import { ActionRow } from "@/components/action-row"
import { EmptyState } from "@/components/empty-state"
import { useLocale } from "@/components/locale-provider"
import { shortRef } from "@/lib/claim-ref"
import { t } from "@/lib/i18n/locale"
import { HEIR_BOX } from "@/features/box/strings/heir-box"

/**
 * Every box that is ready to open.
 *
 * A filter over `claims.mine` rather than a query of its own: a box exists
 * exactly when a claim reaches `released`, and adding a second server function
 * that says the same thing is a second place for the two to disagree.
 *
 * A person almost always has one. The list exists for the person who does not —
 * so the empty state carries the real weight here, and says the wait is normal
 * rather than leaving an empty container on the screen of someone who has just
 * been bereaved.
 */
export function BoxIndex() {
  const locale = useLocale()
  const labels = t(HEIR_BOX, locale)
  const claims = useQuery(api.claims.mine, {})

  if (claims === undefined) {
    return <div className="bg-card rounded-card h-[92px] animate-pulse" aria-hidden />
  }

  const ready = claims.filter((claim) => claim.status === "released")

  if (ready.length === 0) {
    return (
      <EmptyState
        fill
        icon={PackageIcon}
        title={labels.indexEmptyTitle}
        body={labels.indexEmptyBody}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {ready.map((claim) => (
        <ActionRow
          key={claim.id}
          href={`/box/${claim.id}`}
          icon={PackageIcon}
          tone="now"
          // `claims.mine` is keyed on the claimant and carries no subject name;
          // the reference is what identifies the row, and the box page itself
          // names the vault once it has been opened.
          title={shortRef(claim.id)}
          body={labels.openBox}
        />
      ))}
    </div>
  )
}
