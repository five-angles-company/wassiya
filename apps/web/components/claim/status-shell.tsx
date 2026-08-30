import Link from "next/link"

import { BrandMark } from "@/components/shell/brand-mark"
import { LanguageToggle } from "@/components/language-toggle"
import { t, type Locale } from "@/lib/i18n/locale"
import { CLAIM_STATUS } from "@/lib/i18n/strings/claim-status"

/**
 * The status page's own chrome.
 *
 * Its bar differs from the site header in exactly two ways, and both earn it:
 * the claim reference sits in it as a mono pill, and the only link is
 * "contact us". Someone re-opening this page weekly wants the reference to
 * quote and a way to reach a person — not a route back to the marketing.
 */
export function StatusShell({
  locale,
  reference,
  children,
}: {
  locale: Locale
  reference?: string
  children: React.ReactNode
}) {
  const labels = t(CLAIM_STATUS, locale)

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-4 px-[22px] py-[22px] md:px-11">
        <Link href="/" className="flex flex-1 items-center gap-[11px]">
          <BrandMark />
          <span className="font-heading text-[19px] font-extrabold">وصيّة</span>
        </Link>
        {reference !== undefined && (
          <span className="bg-card ltr-isolate rounded-full px-4 py-[9px] font-mono text-[13px]">
            {reference}
          </span>
        )}
        <LanguageToggle locale={locale} />
        <Link
          href="/claim/contact"
          className="hover:text-terracotta-700 hidden text-[14px] opacity-70 transition-colors sm:inline"
        >
          {labels.contact}
        </Link>
      </div>

      <main
        id="content"
        className="mx-auto w-full max-w-[1280px] px-[22px] pt-8 pb-16 md:px-11 md:pt-[52px]"
      >
        {children}
      </main>
    </div>
  )
}
