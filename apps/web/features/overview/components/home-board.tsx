"use client"

import Link from "next/link"
import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"
import {
  FilePlus2Icon,
  FileTextIcon,
  KeyRoundIcon,
  PackageIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  UserCheckIcon,
} from "lucide-react"

import { ActionRow } from "@/components/action-row"
import { Panel } from "@/components/panel"
import { useLocale } from "@/components/locale-provider"
import { shortRef } from "@/lib/claim-ref"
import { fmtNumber } from "@/lib/format"
import { t, type Resolved } from "@/lib/i18n/locale"
import { HOME } from "@/features/overview/strings/home"

/**
 * The front door, once you are through the sign-in wall.
 *
 * It answers one question and refuses to answer it in the abstract: **is
 * anything waiting for me?** So the top of the page is a list of things to do,
 * built from the same three queries the rail uses, and when that list is empty
 * it says so in words rather than rendering an empty container.
 *
 * ## Four states, all of them ordinary
 *
 * Heir, guardian, both, or neither. The fourth is the one products forget: a
 * person who signs in with no report and no guardianship is not broken and not
 * lost — they are almost always someone who clicked past an invitation email,
 * or someone about to file. They get two doors and no dashboard, because a
 * dashboard of zeroes on a bereavement service reads as an accusation.
 *
 * ## The duty rows are asks, not statuses
 *
 * "تأكيد وفاة فاطمة" rather than "1 pending approval". A guardian opens this
 * app once every few years, having been emailed that something needs them; a
 * count tells them nothing they can act on.
 */
export function HomeBoard() {
  const locale = useLocale()
  const labels = t(HOME, locale)

  const me = useQuery(api.users.me, {})
  const claims = useQuery(api.claims.mine, {})
  const duties = useQuery(api.guardians.pendingApprovals, {})
  const vaults = useQuery(api.guardians.guardianFor, {})

  const loading =
    claims === undefined || duties === undefined || vaults === undefined

  if (loading) {
    return (
      <div className="flex flex-col gap-3" aria-hidden>
        <div className="bg-card rounded-card h-24 animate-pulse" />
        <div className="bg-card rounded-card h-24 animate-pulse" />
      </div>
    )
  }

  const name = me?.name ?? null
  const released = claims.filter((claim) => claim.status === "released")
  const isNobody = claims.length === 0 && vaults.length === 0

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-[24px] leading-tight font-extrabold md:text-[28px]">
        {name === null
          ? labels.greetingAnonymous
          : labels.greeting.replace("{name}", name)}
      </h1>

      {isNobody ? (
        <TwoDoors labels={labels} />
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-[17px] font-extrabold">
              {labels.needsYouTitle}
            </h2>

            {duties.map((duty) => (
              <ActionRow
                key={`${duty.claimId}-${duty.duty}`}
                href={`/guardian/${duty.claimId}`}
                icon={duty.duty === "confirm" ? UserCheckIcon : KeyRoundIcon}
                tone={duty.duty === "confirm" && !duty.heirLinked ? "quiet" : "now"}
                title={(duty.duty === "confirm"
                  ? labels.dutyConfirm
                  : labels.dutyHandover
                ).replace("{name}", duty.subjectName ?? "—")}
              />
            ))}

            {released.map((claim) => (
              <ActionRow
                key={claim.id}
                href={`/box/${claim.id}`}
                icon={PackageIcon}
                tone="now"
                title={labels.claimReady}
                body={shortRef(claim.id)}
              />
            ))}

            {duties.length === 0 && released.length === 0 && (
              <Panel tone="settled" title={labels.nothingTitle}>
                <p className="max-w-[62ch] text-[14.5px] leading-[1.7] opacity-90">
                  {labels.nothingBody}
                </p>
              </Panel>
            )}
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            {claims.length > 0 && (
              <ActionRow
                href="/claims"
                icon={FileTextIcon}
                title={labels.yourReports}
                body={labels.yourReportsMeta.replace(
                  "{n}",
                  fmtNumber(claims.length, locale)
                )}
              />
            )}
            {vaults.length > 0 && (
              <ActionRow
                href="/guardian"
                icon={ShieldCheckIcon}
                title={labels.yourVaults}
                body={labels.yourVaultsMeta.replace(
                  "{n}",
                  fmtNumber(vaults.length, locale)
                )}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Two doors and nothing else.
 *
 * The guardian door is deliberately not a link. A guardianship can only be
 * opened from the invitation's own token — that token is what proves the
 * invitation was meant for this person — so offering a button here would lead
 * to a screen that can only say "we need your link". Saying it now is shorter.
 */
function TwoDoors({ labels }: { labels: Resolved<typeof HOME> }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-[18px] font-extrabold">
          {labels.chooseTitle}
        </h2>
        <p className="text-muted-foreground mt-2 max-w-[62ch] text-[14.5px] leading-[1.7]">
          {labels.chooseBody}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel tone="now" icon={FilePlus2Icon} title={labels.doorClaimTitle}>
          <p className="mb-5 text-[14.5px] leading-[1.7] opacity-80">
            {labels.doorClaimBody}
          </p>
          <Link
            href="/claims/new"
            className="bg-primary text-primary-foreground hover:bg-terracotta-600 inline-flex rounded-full px-6 py-3 text-[14.5px] font-semibold transition-colors"
          >
            {labels.doorClaimAction}
          </Link>
        </Panel>

        <Panel icon={ShieldCheckIcon} title={labels.doorGuardianTitle}>
          <p className="text-muted-foreground text-[14.5px] leading-[1.7]">
            {labels.doorGuardianBody}
          </p>
        </Panel>
      </div>

      <Panel tone="plain" icon={SmartphoneIcon} title={labels.ownerTitle}>
        <p className="text-muted-foreground text-[14px] leading-[1.7]">
          {labels.ownerBody}
        </p>
      </Panel>
    </div>
  )
}
