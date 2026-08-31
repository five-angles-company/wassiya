"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"
import {
  FileTextIcon,
  KeyRoundIcon,
  PackageIcon,
  ShieldCheckIcon,
  UserCheckIcon,
} from "lucide-react"

import { ActionRow } from "@/components/action-row"
import { Panel } from "@/components/panel"
import { useLocale } from "@/components/locale-provider"
import { shortRef } from "@/lib/claim-ref"
import { fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { WelcomeDoors } from "@/features/overview/components/welcome-doors"
import { HOME } from "@/features/overview/strings/home"

/**
 * The front door, once you are through the sign-in wall.
 *
 * It answers one question and refuses to answer it in the abstract: **is
 * anything waiting for me?** So the top of the page is a list of things to do,
 * built from the same queries the bar uses, and when that list is empty it says
 * so in words rather than rendering an empty container.
 *
 * ## Four states, all of them ordinary
 *
 * Heir, guardian, both, or neither. The fourth is the one products forget: a
 * person who signs in with no report and no guardianship is not broken and not
 * lost — they are almost always someone who clicked past an invitation email,
 * or someone about to file. They get `WelcomeDoors`, which owns the whole
 * viewport and carries its own greeting; it used to render as a stack of cards
 * under this component's heading, which left three quarters of the screen
 * empty and made the fork look like leftovers.
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

  if (claims.length === 0 && vaults.length === 0) {
    return <WelcomeDoors name={name} />
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-[24px] leading-tight font-extrabold md:text-[28px]">
        {name === null
          ? labels.greetingAnonymous
          : labels.greeting.replace("{name}", name)}
      </h1>

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
    </div>
  )
}
