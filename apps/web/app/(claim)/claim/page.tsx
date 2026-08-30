import type { Metadata } from "next"
import Link from "next/link"

import { ClaimSteps } from "@/components/claim/claim-steps"
import { Band } from "@/components/shell/band"
import { SiteShell } from "@/components/shell/site-shell"
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
    <SiteShell bleed className="pb-24 md:pb-0">
      {/* The ask, on terracotta. The condolence is the first sentence anyone
          reads here, so it sits at display size rather than as body copy under
          a heading that outranks it. */}
      <Band tone="primary" size="tall">
        <h1
          className="rise max-w-[16ch] text-[clamp(32px,7vw,60px)] leading-[1.1]"
          style={{ "--rise-delay": "60ms" } as React.CSSProperties}
        >
          {labels.title}
        </h1>
        <p
          className="rise mt-6 max-w-[48ch] text-[17px] leading-[1.75] opacity-90 md:text-[19px]"
          style={{ "--rise-delay": "170ms" } as React.CSSProperties}
        >
          {labels.condolence}
        </p>
        <div
          className="rise mt-8 hidden md:block"
          style={{ "--rise-delay": "280ms" } as React.CSSProperties}
        >
          <StartButton labels={labels} />
        </div>
      </Band>

      <Band tone="page">
        <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:gap-12">
          {/* The ask. */}
          <div>
            <p className="text-sand-700 text-[16px] leading-[1.8]">
              {labels.intro}
            </p>

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
            <section className="bg-card rounded-sheet shadow-raised rise-in p-6">
              <h2 className="text-[19px]">{labels.needTitle}</h2>
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
      </Band>


      {/* 7.1m: on mobile web the CTA sticks, because this is the likeliest
          first contact and the page is long on a 320px screen. */}
      <div className="bg-background/92 border-border fixed inset-x-0 bottom-0 border-t px-5 py-4 backdrop-blur-md md:hidden">
        <StartButton labels={labels} tone="default" />
      </div>
    </SiteShell>
  )
}

/**
 * The one call to action, in two tones.
 *
 * `onColor` is cream on the terracotta hero; `default` is terracotta on the
 * cream sticky bar. They are the same button and they cannot share a class —
 * the hero version on a cream ground would be a cream button on cream.
 */
function StartButton({
  labels,
  tone = "onColor",
}: {
  labels: Resolved<typeof CLAIM>
  tone?: "onColor" | "default"
}) {
  return (
    <Link
      href="/claim/identity"
      className={`group lift flex w-full items-center justify-center rounded-full px-8 py-4 text-[16px] font-bold md:w-auto ${
        tone === "onColor"
          ? "bg-background text-foreground hover:bg-card"
          : "bg-primary text-primary-foreground hover:bg-terracotta-600"
      }`}
    >
      {labels.start}
      <span className="me-3 text-[13px] font-normal opacity-70">
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
