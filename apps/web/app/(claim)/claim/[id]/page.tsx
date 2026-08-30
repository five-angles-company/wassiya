import type { Metadata } from "next"
import Link from "next/link"
import { fetchQuery } from "convex/nextjs"
import { api } from "@workspace/backend/api"
import { BellOffIcon } from "lucide-react"

import { ClaimTimeline } from "@/components/claim/claim-timeline"
import { StatusShell } from "@/components/claim/status-shell"
import { shortRef } from "@/lib/claim-ref"
import { fmtDate, fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { CLAIM_STATUS } from "@/lib/i18n/strings/claim-status"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: t(CLAIM_STATUS, await getLocale()).metaTitle,
    // Never indexable: the id is a capability, and a search engine holding it
    // would hand the report to anyone.
    robots: { index: false, follow: false },
  }
}

/**
 * ٧.٤ — the page that gets bookmarked.
 *
 * Forwarded to relatives, re-opened weekly for a month, read by someone who is
 * mostly checking that nothing has gone wrong. It works with no account and
 * says the same thing every time.
 *
 * ## The countdown does not move
 *
 * A large static number in a deep-terracotta block with the end date beneath
 * it. No ring, no ticking, nothing that changes while you watch — which is the
 * difference between informing someone and pressuring them. The number is
 * computed on the server once per request, which is why this route is
 * `force-dynamic`: on the one page whose entire purpose is telling someone how
 * long they must wait, a count two days stale is worse than no count.
 *
 * ## Three terminal states, three voices
 *
 * **Released** is olive and owns the whole field — the one unambiguously
 * settled moment in the funnel. The 90-day expiry is stated here rather than on
 * the box, so it cannot be discovered too late, and the key-half requirement is
 * pre-announced so the gate on the next screen is not a surprise.
 *
 * **Vetoed** is an outlined deep terracotta on sand: no filled field, no red,
 * nothing resembling an error dialog. The body names the outcome as correct and
 * clears the reader of blame explicitly, because the likeliest person reading
 * it is a relative who misheard a hospital rumour. The 90-day lockout is stated
 * as a fact, not as a punishment.
 *
 * **Not found** points at the emailed link, because the short reference is a
 * lossy hash and genuinely cannot resolve a report.
 */
export default async function ClaimStatusPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const locale = await getLocale()
  const labels = t(CLAIM_STATUS, locale)

  const claim = await fetchQuery(api.claims.publicStatus, {
    claimId: id,
  }).catch(() => null)

  if (claim === null) {
    return (
      <StatusShell locale={locale}>
        <div className="max-w-[640px]">
          <h1 className="mb-5 text-[34px] leading-[1.1] font-black md:text-[44px]">
            {labels.notFoundHeading}
          </h1>
          <p className="mb-8 text-[17px] leading-[1.7] opacity-80">
            {labels.notFoundBody}
          </p>
          <Link
            href="/claim"
            className="bg-primary text-primary-foreground hover:bg-terracotta-600 font-heading inline-flex h-[60px] items-center rounded-full px-9 text-[18px] font-extrabold transition-colors"
          >
            {labels.startOver}
          </Link>
        </div>
      </StatusShell>
    )
  }

  if (claim.status === "vetoed" || claim.status === "locked") {
    return (
      <StatusShell locale={locale} reference={shortRef(claim.id)}>
        <div className="border-terracotta-700 max-w-[720px] rounded-[30px] border-2 px-8 py-9 md:px-10">
          <h1 className="text-terracotta-800 mb-5 text-[34px] leading-[1.1] font-black md:text-[44px]">
            {labels.vetoedHeading}
          </h1>
          <p className="mb-6 text-[17px] leading-[1.7] opacity-80">
            {labels.vetoedBody}
          </p>
          <p className="text-[14.5px] leading-[1.65] opacity-60">
            {labels.vetoedLockout}
          </p>
        </div>
      </StatusShell>
    )
  }

  if (claim.status === "released") {
    return (
      <StatusShell locale={locale} reference={shortRef(claim.id)}>
        <div className="bg-secondary text-secondary-foreground max-w-[820px] rounded-[30px] px-8 py-10 md:px-11">
          <h1 className="mb-6 text-[38px] leading-[1.08] font-black md:text-[52px]">
            {labels.releasedHeadingOne}
            <br />
            {labels.releasedHeadingTwo}
          </h1>
          <p className="mb-8 max-w-[560px] text-[17px] leading-[1.7] opacity-90 md:text-[18.5px]">
            {labels.releasedBody}
          </p>
          <Link
            href={`/heir/${claim.id}`}
            className="text-secondary font-heading inline-flex h-[64px] items-center rounded-full bg-[color:var(--secondary-foreground)] px-10 text-[19px] font-extrabold"
          >
            {labels.openBox}
          </Link>
          <p className="mt-5 max-w-[520px] text-[14px] leading-[1.65] opacity-75">
            {labels.releasedKeyNote}
          </p>
        </div>
      </StatusShell>
    )
  }

  const deadline = claim.vetoDeadline
  // Read on the server, once per request. That is what "server-authoritative
  // countdown" means here. The purity rule targets client components, where a
  // render-time clock read produces a value that never updates; in an async
  // Server Component the request *is* the moment being reported.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const daysLeft =
    deadline === null
      ? null
      : Math.max(0, Math.ceil((deadline - now) / 86_400_000))

  return (
    <StatusShell locale={locale} reference={shortRef(claim.id)}>
      {claim.subjectName !== null && (
        <div className="flex items-center gap-3.5">
          <span
            aria-hidden
            className="bg-primary h-1 w-[54px] shrink-0 rounded-full"
          />
          <span className="text-terracotta-700 text-[14px] font-semibold">
            {labels.forVault.replace("{name}", claim.subjectName)}
          </span>
        </div>
      )}

      <h1 className="mt-[34px] mb-6 text-[38px] leading-[1.1] font-black tracking-[-0.02em] md:text-[56px]">
        {labels.headingOne}
        <br />
        <span className="text-primary">{labels.headingTwo}</span>
      </h1>

      <p className="mb-10 max-w-[640px] text-[17px] leading-[1.68] opacity-[.76] md:text-[18.5px]">
        {labels.lede}
      </p>

      {daysLeft !== null && (
        <div className="bg-primary text-primary-foreground flex items-center gap-6 rounded-[30px] px-8 py-8 md:gap-[30px] md:px-10">
          <span className="font-heading flex-none text-[64px] leading-[.9] font-black tabular-nums md:text-[84px]">
            {fmtNumber(daysLeft, locale)}
          </span>
          <div className="flex-1">
            <div className="text-[16px] font-bold md:text-[18px]">
              {labels.daysLeft}
            </div>
            <div className="mt-1.5 text-[14px] opacity-80 md:text-[15px]">
              {labels.endsOn}{" "}
              <span className="ltr-isolate font-mono text-[14px]">
                {fmtDate(new Date(deadline!), locale)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div
        aria-hidden
        className="bg-primary -mx-[22px] my-11 h-[14px] md:-mx-11"
      />

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_.74fr] lg:gap-[34px]">
        <div>
          <h2 className="mb-[26px] text-[22px] font-black md:text-[25px]">
            {labels.timelineTitle}
          </h2>
          <ClaimTimeline
            identityVerified={claim.identityVerified}
            certificateReceived={claim.certificateReceived}
            guardianConfirmed={claim.guardianConfirmed}
            status={claim.status}
            deadline={deadline}
            submittedAt={claim.submittedAt}
            locale={locale}
          />
        </div>

        <aside className="flex flex-col gap-4">
          <div className="bg-secondary text-secondary-foreground rounded-[30px] px-8 py-[30px]">
            <span className="text-olive-700 mb-[18px] grid size-[46px] place-items-center rounded-[14px] bg-[color:var(--secondary-foreground)]">
              <BellOffIcon
                className="size-[22px]"
                strokeWidth={2.5}
                aria-hidden
              />
            </span>
            <h3 className="mb-3 text-[20px] font-black md:text-[22px]">
              {labels.nothingTitle}
            </h3>
            <p className="text-[14.5px] leading-[1.72] opacity-90">
              {labels.nothingBody}
            </p>
          </div>

          <div className="bg-muted rounded-[30px] px-[30px] py-[26px]">
            <div className="font-heading mb-2.5 text-[17px] font-extrabold">
              {labels.othersTitle}
            </div>
            <p className="text-[14px] leading-[1.7] opacity-[.78]">
              {labels.othersBody}
            </p>
          </div>
        </aside>
      </div>
    </StatusShell>
  )
}
