"use client"

import Link from "next/link"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"

import { useLocale } from "@/components/locale-provider"
import { RecordNotFound } from "@/components/record-not-found"
import {
  Fact,
  FactsEmpty,
  OwnerFacts,
} from "@/features/owners/components/owner-facts"
import { OwnerHeader } from "@/features/owners/components/owner-header"
import { OwnerProtection } from "@/features/owners/components/owner-protection"
import { OWNERS } from "@/features/owners/strings/owners"
import { fmtBytes, fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"

/**
 * One account, whole.
 *
 * The screen the Accounts group is really about: an operator handling "this
 * person cannot recover their vault" needs identity, devices, the sheet's
 * state and the check-in in one place, and until this existed the console
 * could not show them any of it.
 *
 * **It reports; it does not act.** The one write anywhere near an owner is
 * resetting identity attempts, and that lives on the identity queue where the
 * blocked accounts are already gathered. Nothing here revokes a device or edits
 * an heir — those are the owner's decisions, made on their own device, and a
 * console that could make them for them would be a far larger security surface
 * than a console that reads.
 */
export function OwnerDetail({ userId }: { userId: string }) {
  const locale = useLocale()
  const labels = t(OWNERS, locale)
  // No cast: the server takes the raw path segment and normalises it, so an id
  // that is malformed and one that names a deleted account both come back as
  // `null` rather than throwing. This screen is linked to from eight places,
  // one of which is the audit log — append-only, and therefore outliving the
  // accounts it names.
  const detail = useQuery(api.admin.ownerDetail, { userId })

  if (detail === undefined) {
    return <Skeleton className="h-96 w-full rounded-xl" />
  }
  if (detail === null) {
    return (
      <RecordNotFound
        id={userId}
        backHref="/owners"
        backLabel={labels.back}
      />
    )
  }

  const { owner, devices, heirs, claims } = detail

  return (
    <div className="flex flex-col gap-4">
      <OwnerHeader owner={owner} locale={locale} />

      <div className="grid gap-4 xl:grid-cols-2">
        <OwnerFacts title={labels.sectionIdentity}>
          <Fact
            label={labels.verifiedName}
            value={owner.identityVerifiedName ?? labels.none}
          />
          <Fact
            label={labels.docType}
            value={owner.identityDocType ?? labels.none}
          />
          <Fact
            label={labels.verifiedAt}
            value={
              owner.identityVerifiedAt === null
                ? labels.none
                : fmtDate(owner.identityVerifiedAt, locale)
            }
          />
          <Fact label={labels.attempts} value={owner.identityAttempts} />
        </OwnerFacts>

        {/* Plan, country and joined date are in the header now. What is left
            here is the one subscription fact a header cannot carry. */}
        <OwnerFacts title={labels.colPlan}>
          <Fact
            label={labels.colStorage}
            value={fmtBytes(owner.storageBytesUsed, locale)}
          />
          <Fact
            label={labels.nextDue}
            value={
              owner.renewsAt === null
                ? labels.none
                : fmtDate(owner.renewsAt, locale)
            }
          />
        </OwnerFacts>

        <OwnerProtection detail={detail} locale={locale} />

        <OwnerFacts title={labels.sectionHeirs}>
          {heirs.length === 0 ? (
            <FactsEmpty>{labels.heirsNone}</FactsEmpty>
          ) : (
            heirs.map((heir) => (
              <Fact
                key={heir.id}
                label={heir.relation}
                value={
                  <span className="flex flex-col items-end">
                    <span>{heir.name}</span>
                    <span dir="ltr" className="text-xs text-muted-foreground">
                      {heir.phone}
                    </span>
                  </span>
                }
              />
            ))
          )}
        </OwnerFacts>

        <OwnerFacts title={labels.sectionDevices}>
          {devices.length === 0 ? (
            <FactsEmpty>{labels.devicesNone}</FactsEmpty>
          ) : (
            devices.map((device) => (
              <Fact
                key={device.id}
                label={device.platform}
                value={
                  <span className="flex items-center justify-end gap-2">
                    {device.revoked && (
                      <Badge variant="destructive">
                        {labels.deviceRevoked}
                      </Badge>
                    )}
                    <span className="flex flex-col items-end">
                      <span>{device.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {device.lastUnlockAt === null
                          ? labels.never
                          : fmtDate(device.lastUnlockAt, locale)}
                      </span>
                    </span>
                  </span>
                }
              />
            ))
          )}
        </OwnerFacts>

        <OwnerFacts title={labels.sectionClaims}>
          {claims.length === 0 ? (
            <FactsEmpty>{labels.claimsNone}</FactsEmpty>
          ) : (
            claims.map((claim) => (
              <Fact
                key={claim.id}
                label={fmtDate(claim.submittedAt, locale)}
                value={
                  <Link
                    href={`/claims/${claim.id}`}
                    className="hover:underline"
                  >
                    {claim.claimantName}{" "}
                    <Badge variant="outline">{claim.status}</Badge>
                  </Link>
                }
              />
            ))
          )}
        </OwnerFacts>
      </div>
    </div>
  )
}
