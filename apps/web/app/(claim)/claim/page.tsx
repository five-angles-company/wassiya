import type { Metadata } from "next"
import Link from "next/link"

import { ClaimBrand } from "@/components/claim/claim-brand"
import { ClaimSteps } from "@/components/claim/claim-steps"
import { t, type Resolved } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { CLAIM } from "@/lib/i18n/strings/claim"

/**
 * ٧.١ — the public claim landing, at `/claim`.
 *
 * ## Why this page is a Server Component with no client JavaScript
 *
 * The board: *"Server-rendered, no app-store detour, works at 320px and on an
 * old browser — this page is reached in the worst week of someone's life."*
 * There is no `"use client"` here and nothing interactive beyond links, so it
 * renders and works with JS disabled, on an old phone, over a bad connection.
 * That is a functional requirement, not an optimisation: the likeliest first
 * contact is a QR printed on a recovery sheet, scanned by a grieving relative
 * on whatever device is nearby.
 *
 * ## The two-column layout is load-bearing
 *
 * *"The commonest failure is starting without the certificate."* So the
 * requirements and the timeline sit **beside** the call to action on a wide
 * screen, not below it — someone who scrolls past them and taps has already
 * been failed. On mobile the same content stacks and the CTA sticks to the
 * bottom, which is 7.1m: the same route, one column.
 *
 * Public, unauthenticated and indexable — deliberately. Someone searching for
 * what to do about a relative's Wassiya vault should find this page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const labels = t(CLAIM, await getLocale())
  return { title: labels.metaTitle, description: labels.metaDescription }
}

export default async function ClaimLandingPage() {
  const locale = await getLocale()
  const labels = t(CLAIM, locale)

  // Rebuilt from resolved labels rather than held as arrays in the dictionary,
  // which `t()` cannot walk. Each line stays individually addressable, and the
  // order lives here — where the layout that depends on it is.
  const needs = [labels.needId, labels.needCertificate, labels.needPhone]
  const steps = [
    { label: labels.stepIdentity, meta: labels.stepIdentityMeta },
    { label: labels.stepCertificate },
    { label: labels.stepVeto, meta: labels.stepVetoMeta },
    { label: labels.stepRelease },
  ]

  return (
    <div className="min-h-screen pb-28 md:pb-0">
      <ClaimBrand />

      <main className="mx-auto max-w-5xl px-5 pt-6 md:px-8 md:pt-12">
        <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:gap-12">
          {/* The ask. */}
          <div>
            <h1 className="text-[30px] leading-[1.25] md:text-[40px]">
              {labels.title}
            </h1>
            <p className="text-sand-700 mt-4 text-[15.5px] leading-[1.75]">
              {labels.intro}
            </p>
            {/* Reviewed copy, one sentence, first person. It is the first thing
                said to someone who has just lost a person. */}
            <p className="text-sand-700 mt-3 text-[15.5px] leading-[1.75]">
              {labels.condolence}
            </p>

            <div className="mt-7 hidden md:block">
              <StartButton labels={labels} />
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <QuietLink
                href="/claim/resume"
                title={labels.resumeTitle}
                body={labels.resumeBody}
              />
              {/* Deliberately quiet but present: a living owner sometimes lands
                  here first, and telling them where to go costs one line. */}
              <QuietLink
                href="/claim/guardian"
                title={labels.guardianTitle}
                body={labels.guardianBody}
              />
            </div>
          </div>

          {/* What they need, and what happens. Beside the CTA, never below. */}
          <aside className="flex flex-col gap-6">
            <section className="bg-card rounded-card p-5">
              <h2 className="text-[17px]">{labels.needTitle}</h2>
              <ul className="mt-3 flex flex-col gap-2.5">
                {needs.map((need) => (
                  <li
                    key={need}
                    className="flex items-start gap-2.5 text-[14.5px] leading-[1.6]"
                  >
                    <span
                      aria-hidden
                      className="bg-terracotta-200 mt-1.5 size-2 shrink-0 rounded-full"
                    />
                    {need}
                  </li>
                ))}
              </ul>
            </section>

            <ClaimSteps steps={steps} locale={locale} />
          </aside>
        </div>

        <footer className="text-sand-600 mt-12 border-t border-[color-mix(in_srgb,#201e1d_12%,transparent)] pt-6 text-[13px]">
          {/* Said plainly and early, because the commonest misunderstanding is
              that this service divides an estate. It does not. */}
          <p>{labels.disclaimer}</p>
          <nav className="mt-3 flex flex-wrap gap-4">
            <Link className="hover:text-terracotta-700" href="/legal/terms">
              {labels.terms}
            </Link>
            <Link className="hover:text-terracotta-700" href="/legal/privacy">
              {labels.privacy}
            </Link>
            <Link className="hover:text-terracotta-700" href="/legal/encryption">
              {labels.howEncryption}
            </Link>
          </nav>
        </footer>
      </main>

      {/* 7.1m: on mobile web the CTA sticks, because this is the likeliest
          first contact and the page is long on a 320px screen. */}
      <div className="bg-background/95 fixed inset-x-0 bottom-0 border-t border-[color-mix(in_srgb,#201e1d_12%,transparent)] px-5 py-4 backdrop-blur md:hidden">
        <StartButton labels={labels} />
      </div>
    </div>
  )
}

function StartButton({ labels }: { labels: Resolved<typeof CLAIM> }) {
  return (
    <Link
      href="/claim/identity"
      className="bg-primary text-primary-foreground hover:bg-terracotta-600 flex w-full items-center justify-center rounded-full px-8 py-3.5 text-[15.5px] font-semibold transition-colors md:w-auto"
    >
      {labels.start}
      <span className="text-primary-foreground/75 me-3 text-[13px] font-normal">
        {labels.startMeta}
      </span>
    </Link>
  )
}

function QuietLink({
  href,
  title,
  body,
}: {
  href: string
  title: string
  body: string
}) {
  return (
    <Link
      href={href}
      className="border-border hover:bg-sand-200 rounded-row border p-4 transition-colors"
    >
      <p className="text-[14.5px] font-semibold">{title}</p>
      <p className="text-sand-600 mt-1 text-[13px] leading-[1.6]">{body}</p>
    </Link>
  )
}
