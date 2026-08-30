import type { Metadata } from "next"
import Link from "next/link"
import { fetchQuery } from "convex/nextjs"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"

import { ClaimTimeline } from "@/components/claim/claim-timeline"
import { SiteShell } from "@/components/shell/site-shell"
import { shortRef } from "@/lib/claim-ref"
import { fmtDate, fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { CLAIM_STATUS } from "@/lib/i18n/strings/claim-status"

/**
 * ٧.٤ — `/claim/:id`. The most-visited page in the funnel.
 *
 * *"Bookmarked, forwarded to relatives, re-opened weekly for a month."* So it
 * has to work with no account, survive being shared, and say the same thing
 * every time.
 *
 * ## The countdown is computed on the server, every request
 *
 * `export const dynamic = "force-dynamic"` because this page renders a number
 * of days remaining. A cached copy would show a stale count — and on the one
 * page whose entire purpose is telling someone how long they must wait, a
 * number that is quietly two days out of date is worse than no number. The
 * board says the countdown is server-authoritative; this is what that means in
 * practice.
 *
 * ## Radical transparency, including that the owner was warned
 *
 * The timeline names the notification step explicitly. It would be easy to
 * omit — the claimant might feel watched — but the board is firm that vagueness
 * here *"reads as theft or stonewalling"*. Someone who later learns the account
 * holder was contacted, and was not told so, has been deceived by omission.
 *
 * A veto renders as a short, plain close. It is a designed state, not an error,
 * and it must not read as an accusation of fraud against someone who has
 * usually just lost a relative.
 */
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: t(CLAIM_STATUS, await getLocale()).metaTitle,
    // Never indexable: the id is a capability, and a search engine holding it
    // would hand the page to anyone.
    robots: { index: false, follow: false },
  }
}

export default async function ClaimStatusPage({
  params,
}: {
  // Async in this version of Next — see `docs/01-app/.../page.md`.
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const locale = await getLocale()
  const labels = t(CLAIM_STATUS, locale)

  const claim = await fetchQuery(api.claims.publicStatus, {
    claimId: id as Id<"claims">,
  }).catch(() => null)

  if (claim === null) {
    return (
      <Shell>
        <h1 className="text-[26px]">{labels.notFoundTitle}</h1>
        <p className="text-sand-700 mt-3 text-[15px] leading-[1.75]">
          {labels.notFoundBody}
        </p>
        <Link
          href="/claim"
          className="bg-primary text-primary-foreground hover:bg-terracotta-600 mt-6 inline-flex rounded-full px-6 py-3 text-[15px] font-semibold"
        >
          {labels.startOver}
        </Link>
      </Shell>
    )
  }

  if (claim.status === "vetoed" || claim.status === "locked") {
    return (
      <Shell>
        <h1 className="text-[26px]">{labels.vetoedTitle}</h1>
        <p className="text-sand-700 mt-3 text-[15px] leading-[1.75]">
          {labels.vetoedBody}
        </p>
        <ClaimRef id={claim.id} submittedAt={claim.submittedAt} />
      </Shell>
    )
  }

  if (claim.status === "released") {
    return (
      <Shell>
        <h1 className="text-[26px]">{labels.releasedTitle}</h1>
        <p className="text-sand-700 mt-3 text-[15px] leading-[1.75]">
          {labels.releasedBody}
        </p>
        <Link
          href={`/heir/${claim.id}`}
          className="bg-secondary text-secondary-foreground hover:bg-olive-600 mt-6 inline-flex rounded-full px-6 py-3 text-[15px] font-semibold"
        >
          {labels.openBox}
        </Link>
        <ClaimRef id={claim.id} submittedAt={claim.submittedAt} />
      </Shell>
    )
  }

  const deadline = claim.vetoDeadline
  // Read the clock on the server, once per request. That is precisely what
  // "server-authoritative countdown" means here, and it is why this route is
  // `force-dynamic`. The React purity rule is aimed at client components, where
  // a render-time clock read produces a value that never updates; in an async
  // Server Component the request *is* the moment being reported.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const daysLeft =
    deadline === null
      ? null
      : Math.max(0, Math.ceil((deadline - now) / 86_400_000))

  return (
    <Shell>
      <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:gap-12">
        <div>
          <h1 className="text-[28px] leading-[1.25] md:text-[34px]">
            {labels.heading}
          </h1>
          <p className="text-sand-700 mt-4 text-[15.5px] leading-[1.75]">
            {labels.why.replace(
              "{date}",
              deadline === null ? "—" : fmtDate(new Date(deadline), locale)
            )}
          </p>

          <ClaimTimeline
            className="mt-7"
            identityVerified={claim.identityVerified}
            certificateReceived={claim.certificateReceived}
            guardianConfirmed={claim.guardianConfirmed}
            status={claim.status}
            deadline={deadline}
            locale={locale}
          />
        </div>

        <aside className="flex flex-col gap-5">
          {/* The count, large, because it is the one thing they came for. */}
          {daysLeft !== null ? (
            <div className="bg-card rounded-card flex flex-col items-center px-5 py-7">
              <span className="text-terracotta-700 text-[52px] leading-none font-black">
                {fmtNumber(daysLeft, locale)}
              </span>
              <span className="text-sand-700 mt-2 text-[14px]">
                {labels.daysLeft}
              </span>
              <span className="text-sand-600 mt-3 text-center text-[12.5px] leading-[1.6]">
                {labels.vetoEnds.replace(
                  "{date}",
                  fmtDate(new Date(deadline!), locale)
                )}
              </span>
            </div>
          ) : null}

          <ClaimRef id={claim.id} submittedAt={claim.submittedAt} />

          <p className="text-sand-600 text-[13px] leading-[1.7]">
            {labels.noLogin}
          </p>
          <Link
            href="/claim/contact"
            className="border-border hover:bg-sand-200 rounded-full border px-5 py-2.5 text-center text-[14px]"
          >
            {labels.contact}
          </Link>
        </aside>
      </div>
    </Shell>
  )
}

async function ClaimRef({
  id,
  submittedAt,
}: {
  id: string
  submittedAt: number
}) {
  const locale = await getLocale()
  const labels = t(CLAIM_STATUS, locale)

  return (
    <div className="bg-card rounded-row mt-6 p-4">
      <p className="text-sand-600 text-[12px]">{labels.claimRef}</p>
      {/* A Latin reference inside Arabic prose — isolated so the bidi
          algorithm does not reorder it. */}
      <p className="ltr-isolate mt-1 text-[15px] font-semibold">
        {shortRef(id)}
      </p>
      <p className="text-sand-600 mt-2 text-[12.5px]">
        {labels.submittedAt.replace(
          "{date}",
          fmtDate(new Date(submittedAt), locale)
        )}
      </p>
    </div>
  )
}

async function Shell({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>
}
