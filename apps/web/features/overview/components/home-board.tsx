"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"
import {
  CheckIcon,
  FileTextIcon,
  KeyRoundIcon,
  PackageIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  type LucideIcon,
} from "lucide-react"

import { ActionCard } from "@/components/action-card"
import { Panel } from "@/components/panel"
import { useLocale } from "@/components/locale-provider"
import { shortRef } from "@/lib/claim-ref"
import { fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { SummaryTile } from "@/features/overview/components/summary-tile"
import { WelcomeDoors } from "@/features/overview/components/welcome-doors"
import { HOME } from "@/features/overview/strings/home"

/** One thing on the home screen that is asking the reader to act. */
type Ask = {
  key: string
  href: string
  icon: LucideIcon
  title: string
  meta?: string
  body: string
  action: string
  tone: "now" | "waiting"
}

/**
 * The front door, once you are through the sign-in wall.
 *
 * It answers one question and refuses to answer it in the abstract: **is
 * anything waiting for me?** So the top of the page is what needs the reader,
 * and when that is empty it says so in words rather than rendering an empty
 * container.
 *
 * ## Two kinds of thing, two shapes
 *
 * The asks and the doors were the same full-width row, which said the four
 * items were one list of four equal things. They are not — two of them need the
 * reader today and two are places to go with a count on them. Asks are cards
 * two to a row, carrying a sentence about what happens if you act; doors are
 * compact tiles with the figure doing the work.
 *
 * ## Four states, all of them ordinary
 *
 * Heir, guardian, both, or neither. The fourth is the one products forget: a
 * person who signs in with no report and no guardianship is not broken and not
 * lost — they get `WelcomeDoors`, which owns the whole viewport and carries its
 * own greeting.
 *
 * ## The asks are phrased as asks
 *
 * "تأكيد وفاة فاطمة" rather than "1 pending approval". A guardian opens this app
 * once every few years, having been emailed that something needs them; a count
 * tells them nothing they can act on.
 */
export function HomeBoard() {
  const locale = useLocale()
  const labels = t(HOME, locale)

  const me = useQuery(api.users.me, {})
  const claims = useQuery(api.claims.mine, {})
  const duties = useQuery(api.guardians.pendingApprovals, {})
  const vaults = useQuery(api.guardians.guardianFor, {})

  if (claims === undefined || duties === undefined || vaults === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2" aria-hidden>
        <div className="bg-card rounded-sheet h-52 animate-pulse" />
        <div className="bg-card rounded-sheet h-52 animate-pulse" />
      </div>
    )
  }

  const name = me?.name ?? null
  const released = claims.filter((claim) => claim.status === "released")

  if (claims.length === 0 && vaults.length === 0) {
    return <WelcomeDoors name={name} />
  }

  // Typed rather than inferred: the two halves of this list have different
  // shapes (only a released box carries a reference), and a union of two object
  // literals widens `meta` to `unknown` at the call site.
  const asks: Ask[] = [
    ...duties.map((duty) => {
      const blocked = duty.duty === "confirm" && !duty.heirLinked
      return {
        key: `${duty.claimId}-${duty.duty}`,
        href: `/guardian/${duty.claimId}`,
        icon: duty.duty === "confirm" ? UserCheckIcon : KeyRoundIcon,
        title: (duty.duty === "confirm"
          ? labels.dutyConfirm
          : labels.dutyHandover
        ).replace("{name}", duty.subjectName ?? "—"),
        body: blocked
          ? labels.dutyBlockedBody
          : duty.duty === "confirm"
            ? labels.dutyConfirmBody
            : labels.dutyHandoverBody,
        action: labels.review,
        tone: blocked ? ("waiting" as const) : ("now" as const),
      }
    }),
    ...released.map((claim) => ({
      key: claim.id,
      href: `/box/${claim.id}`,
      icon: PackageIcon,
      title: labels.claimReady,
      meta: shortRef(claim.id),
      body: labels.claimReadyBody,
      action: labels.open,
      tone: "now" as const,
    })),
  ]

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading text-[26px] leading-tight font-extrabold md:text-[30px]">
        {name === null
          ? labels.greetingAnonymous
          : labels.greeting.replace("{name}", name)}
      </h1>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <h2 className="font-heading text-[17px] font-extrabold">
            {labels.needsYouTitle}
          </h2>
          {asks.length > 0 && (
            <span className="bg-primary text-primary-foreground grid size-6 place-items-center rounded-full text-[12px] font-bold tabular-nums">
              {fmtNumber(asks.length, locale)}
            </span>
          )}
        </div>

        {asks.length === 0 ? (
          <Panel accent="secondary" icon={CheckIcon} title={labels.nothingTitle}>
            <p className="text-muted-foreground max-w-[62ch] text-[14.5px] leading-[1.7]">
              {labels.nothingBody}
            </p>
          </Panel>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {asks.map((ask, index) => (
              <ActionCard
                key={ask.key}
                href={ask.href}
                icon={ask.icon}
                title={ask.title}
                meta={ask.meta}
                body={ask.body}
                action={ask.action}
                tone={ask.tone}
                delay={index * 70}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {claims.length > 0 && (
          <SummaryTile
            href="/claims"
            icon={FileTextIcon}
            label={labels.yourReports}
            value={fmtNumber(claims.length, locale)}
            unit={labels.unitReports}
            delay={asks.length * 70}
          />
        )}
        {vaults.length > 0 && (
          <SummaryTile
            href="/guardian"
            icon={ShieldCheckIcon}
            label={labels.yourVaults}
            value={fmtNumber(vaults.length, locale)}
            unit={labels.unitVaults}
            delay={asks.length * 70 + 70}
          />
        )}
      </section>
    </div>
  )
}
