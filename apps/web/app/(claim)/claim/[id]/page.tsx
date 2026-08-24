import type { Metadata } from "next"
import Link from "next/link"
import { fetchQuery } from "convex/nextjs"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"

import { ClaimBrand } from "@/components/claim/claim-brand"
import { ClaimTimeline } from "@/components/claim/claim-timeline"
import { CLAIM, CLAIM_STATUS } from "@/lib/claim-copy"
import { fmtArabicDate, fmtArabicNumber } from "@/lib/format-ar"

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

export const metadata: Metadata = {
  title: CLAIM_STATUS.metaTitle,
  // Never indexable: the id is a capability, and a search engine holding it
  // would hand the page to anyone.
  robots: { index: false, follow: false },
}

export default async function ClaimStatusPage({
  params,
}: {
  // Async in this version of Next — see `docs/01-app/.../page.md`.
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const claim = await fetchQuery(api.claims.publicStatus, {
    claimId: id as Id<"claims">,
  }).catch(() => null)

  if (claim === null) {
    return (
      <Shell>
        <h1 className="text-[26px]">{CLAIM_STATUS.notFoundTitle}</h1>
        <p className="text-sand-700 mt-3 text-[15px] leading-[1.75]">
          {CLAIM_STATUS.notFoundBody}
        </p>
        <Link
          href="/claim"
          className="bg-primary text-primary-foreground hover:bg-terracotta-600 mt-6 inline-flex rounded-full px-6 py-3 text-[15px] font-semibold"
        >
          {CLAIM_STATUS.startOver}
        </Link>
      </Shell>
    )
  }

  if (claim.status === "vetoed" || claim.status === "locked") {
    return (
      <Shell>
        <h1 className="text-[26px]">{CLAIM_STATUS.vetoedTitle}</h1>
        <p className="text-sand-700 mt-3 text-[15px] leading-[1.75]">
          {CLAIM_STATUS.vetoedBody}
        </p>
        <ClaimRef id={claim.id} submittedAt={claim.submittedAt} />
      </Shell>
    )
  }

  if (claim.status === "released") {
    return (
      <Shell>
        <h1 className="text-[26px]">{CLAIM_STATUS.releasedTitle}</h1>
        <p className="text-sand-700 mt-3 text-[15px] leading-[1.75]">
          {CLAIM_STATUS.releasedBody}
        </p>
        <Link
          href={`/heir/${claim.id}`}
          className="bg-secondary text-secondary-foreground hover:bg-olive-600 mt-6 inline-flex rounded-full px-6 py-3 text-[15px] font-semibold"
        >
          {CLAIM_STATUS.openBox}
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
            {CLAIM_STATUS.heading}
          </h1>
          <p className="text-sand-700 mt-4 text-[15.5px] leading-[1.75]">
            {CLAIM_STATUS.why.replace(
              "{date}",
              deadline === null ? "—" : fmtArabicDate(new Date(deadline))
            )}
          </p>

          <ClaimTimeline
            className="mt-7"
            identityVerified={claim.identityVerified}
            certificateReceived={claim.certificateReceived}
            guardianConfirmed={claim.guardianConfirmed}
            status={claim.status}
            deadline={deadline}
          />
        </div>

        <aside className="flex flex-col gap-5">
          {/* The count, large, because it is the one thing they came for. */}
          {daysLeft !== null ? (
            <div className="bg-card rounded-card flex flex-col items-center px-5 py-7">
              <span className="text-terracotta-700 text-[52px] leading-none font-black">
                {fmtArabicNumber(daysLeft)}
              </span>
              <span className="text-sand-700 mt-2 text-[14px]">
                {CLAIM_STATUS.daysLeft}
              </span>
              <span className="text-sand-600 mt-3 text-center text-[12.5px] leading-[1.6]">
                {CLAIM_STATUS.vetoEnds.replace(
                  "{date}",
                  fmtArabicDate(new Date(deadline!))
                )}
              </span>
            </div>
          ) : null}

          <ClaimRef id={claim.id} submittedAt={claim.submittedAt} />

          <p className="text-sand-600 text-[13px] leading-[1.7]">
            {CLAIM_STATUS.noLogin}
          </p>
          <Link
            href="/claim/contact"
            className="border-border hover:bg-sand-200 rounded-full border px-5 py-2.5 text-center text-[14px]"
          >
            {CLAIM_STATUS.contact}
          </Link>
        </aside>
      </div>
    </Shell>
  )
}

function ClaimRef({ id, submittedAt }: { id: string; submittedAt: number }) {
  return (
    <div className="bg-card rounded-row mt-6 p-4">
      <p className="text-sand-600 text-[12px]">{CLAIM_STATUS.claimRef}</p>
      {/* A Latin reference inside Arabic prose — isolated so the bidi
          algorithm does not reorder it. */}
      <p className="ltr-isolate mt-1 text-[15px] font-semibold">
        {shortRef(id)}
      </p>
      <p className="text-sand-600 mt-2 text-[12.5px]">
        {CLAIM_STATUS.submittedAt.replace(
          "{date}",
          fmtArabicDate(new Date(submittedAt))
        )}
      </p>
    </div>
  )
}

/**
 * A human-quotable reference. The board shows "C-4482", which is short enough
 * to read down a phone to support; a raw Convex id is 32 characters and would
 * be transcribed wrong every time.
 *
 * Derived from the id rather than stored, so it needs no column and cannot
 * drift from it. It is **not** a secret and not a lookup key — the full id in
 * the URL remains the capability.
 */
function shortRef(id: string): string {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 10_000
  return `C-${String(hash).padStart(4, "0")}`
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-16">
      <ClaimBrand />
      <main className="mx-auto max-w-5xl px-5 pt-6 md:px-8 md:pt-12">
        {children}
        <footer className="text-sand-600 mt-12 border-t border-[color-mix(in_srgb,#201e1d_12%,transparent)] pt-6 text-[13px]">
          {CLAIM.disclaimer}
        </footer>
      </main>
    </div>
  )
}
