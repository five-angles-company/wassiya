import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon, ClockIcon, LockIcon } from "lucide-react"

import { SiteHeader } from "@/components/shell/site-header"
import { t, type Locale, type Resolved } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { CLAIM } from "@/lib/i18n/strings/claim"

export async function generateMetadata(): Promise<Metadata> {
  const labels = t(CLAIM, await getLocale())
  return { title: labels.metaTitle, description: labels.metaDescription }
}

/**
 * ٧.١ — the public claim landing, at `/claim`.
 *
 * ## Why the requirements sit beside the button
 *
 * The board: *"the commonest reason people stall is starting without the
 * certificate."* So the three things they need are in an **ink-dark panel at
 * 0.85fr, beside the call to action** — visible without scrolling, and the only
 * near-black field anywhere in the funnel, which is what makes it read as
 * reference material rather than as a second action competing with the first.
 *
 * Under 1024px the panel drops below and the action sticks to the bottom: on a
 * 320px screen this page is long, and it is the likeliest first contact in the
 * whole product.
 *
 * ## No client JavaScript
 *
 * The board asks for a page that *"renders fully without JavaScript"* — reached
 * on an old browser, in the worst week of someone's life, often from a QR code
 * printed on a recovery sheet. Nothing here is interactive beyond links.
 */
export default async function ClaimLandingPage() {
  const locale = await getLocale()
  const labels = t(CLAIM, locale)

  return (
    <div className="flex min-h-screen flex-col pb-24 lg:pb-0">
      <SiteHeader variant="focused" />

      <main
        id="content"
        className="mx-auto w-full max-w-[1280px] px-[22px] pt-4 pb-11 md:px-11"
      >
        <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-[34px]">
          <div>
            <div className="bg-accent text-accent-foreground mb-6 inline-flex items-center gap-2.5 rounded-full px-[18px] py-2.5 text-[13.5px] font-semibold md:mb-[26px]">
              <ClockIcon className="size-4" strokeWidth={2.5} aria-hidden />
              {labels.timing}
            </div>

            <h1 className="mb-5 text-[42px] leading-[1.06] font-black md:mb-[22px] md:text-[62px]">
              {labels.title}
            </h1>

            <p className="mb-7 max-w-[560px] text-[17px] leading-[1.7] opacity-80 md:mb-[30px] md:text-[19.5px] md:leading-[1.68]">
              {labels.intro}
            </p>

            {/* Desktop action. On small screens it moves to the sticky bar. */}
            <div className="mb-[22px] hidden items-center gap-3.5 lg:flex">
              <StartButton labels={labels} />
              <span className="max-w-[190px] text-[14px] leading-[1.5] opacity-60">
                {labels.startMeta}
              </span>
            </div>

            <div className="bg-muted max-w-[600px] rounded-[26px] px-[26px] py-[22px]">
              <p className="text-[14px] leading-[1.72] opacity-80">
                {labels.disclaimer}
              </p>
            </div>
          </div>

          {/* The only near-black field in the funnel. */}
          <aside className="rounded-[30px] bg-[#201e1d] px-[34px] py-8 text-[#f5ead8]">
            <h2 className="mb-2 text-[22px] font-black md:text-[25px]">
              {labels.needTitle}
            </h2>
            <p className="mb-[26px] text-[14px] leading-[1.65] opacity-65">
              {labels.needWhy}
            </p>

            <ol className="flex flex-col gap-5">
              <Need
                n={1}
                locale={locale}
                title={labels.needIdTitle}
                body={labels.needIdBody}
              />
              <Need
                n={2}
                locale={locale}
                title={labels.needCertificateTitle}
                body={labels.needCertificateBody}
              />
              <Need
                n={3}
                locale={locale}
                title={labels.needEmailTitle}
                body={labels.needEmailBody}
              />
            </ol>

            <div
              aria-hidden
              className="my-[26px] mb-5 h-px bg-[color:rgba(245,234,216,.18)]"
            />

            <div className="flex items-start gap-3">
              <LockIcon
                className="mt-0.5 size-4 shrink-0 opacity-70"
                strokeWidth={2.2}
                aria-hidden
              />
              <p className="text-[13px] leading-[1.7] opacity-70">
                {labels.needPrivacy}
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* 7.1m: the action sticks on small screens, because this page is long at
          320px and it is the likeliest first contact in the product. */}
      <div className="bg-background/92 border-border fixed inset-x-0 bottom-0 border-t px-[22px] py-4 backdrop-blur-md lg:hidden">
        <StartButton labels={labels} full />
        <p className="mt-2 text-center text-[12.5px] opacity-60">
          {labels.startMeta}
        </p>
      </div>
    </div>
  )
}

/** Numbered, because these are things to gather in order, not a feature list. */
function Need({
  n,
  locale,
  title,
  body,
}: {
  n: number
  locale: Locale
  title: string
  body: string
}) {
  return (
    <li className="flex gap-[15px]">
      <span
        aria-hidden
        className="bg-primary text-primary-foreground font-heading grid size-9 shrink-0 place-items-center rounded-[11px] text-[16px] font-black"
      >
        {locale === "ar" ? "١٢٣"[n - 1] : n}
      </span>
      <div>
        <div className="mb-1 text-[16.5px] font-semibold">{title}</div>
        <div className="text-[13.5px] leading-[1.6] opacity-60">{body}</div>
      </div>
    </li>
  )
}

function StartButton({
  labels,
  full = false,
}: {
  labels: Resolved<typeof CLAIM>
  full?: boolean
}) {
  return (
    <Link
      href="/claim/identity"
      className={`bg-primary text-primary-foreground hover:bg-terracotta-600 font-heading inline-flex h-[64px] items-center justify-center gap-[11px] rounded-full px-10 text-[19px] font-extrabold whitespace-nowrap transition-colors md:h-[70px] md:text-[21px] ${
        full ? "w-full" : ""
      }`}
    >
      {labels.start}
      <ArrowRightIcon
        className="size-5 rtl:-scale-x-100"
        strokeWidth={2.75}
        aria-hidden
      />
    </Link>
  )
}
