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
import { PageHeader } from "@/components/page-header"
import { Panel } from "@/components/panel"
import { Section } from "@/components/section"
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
 * The front door, once you are through the sign-in wall. It answers one
 * question — **is anything waiting for me?** — and when the answer is nothing it
 * says so in words rather than rendering an empty container.
 *
 * Two kinds of thing, two shapes: asks are cards two to a row carrying a
 * sentence about what happens if you act, doors are compact tiles with the
 * figure doing the work. As one full-width row they read as four equal things,
 * which they are not.
 *
 * Four states, all ordinary — heir, guardian, both, or neither. The fourth is
 * the one products forget: a person with no report and no guardianship is not
 * broken and not lost, and gets `WelcomeDoors`.
 *
 * The asks are phrased as asks — "تأكيد وفاة فاطمة", not "1 pending approval". A
 * guardian arrives having been emailed that something needs them, and a count
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
      <PageHeader
        title={
          name === null
            ? labels.greetingAnonymous
            : labels.greeting.replace("{name}", name)
        }
      />

      <Section
        title={labels.needsYouTitle}
        count={asks.length > 0 ? fmtNumber(asks.length, locale) : undefined}
      >
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
      </Section>

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
