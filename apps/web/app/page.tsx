import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon, SmartphoneIcon } from "lucide-react"

import { SiteShell } from "@/components/shell/site-shell"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { HOME } from "@/lib/i18n/strings/common"

export async function generateMetadata(): Promise<Metadata> {
  const labels = t(HOME, await getLocale())
  return { title: labels.metaTitle, description: labels.metaDescription }
}

/**
 * `/` — two doors, and a third message for the owner who lands here by mistake.
 *
 * Built to the design board, whose own note explains the shape:
 *
 * > Type-led and single-column: eyebrow, a 72px Cairo 900 headline with its
 * > second line in terracotta, one paragraph at 600px, two pills, a 14px rule.
 * > Nothing competes for the same horizontal band, which is what makes it read
 * > calm at this scale — the earlier side-column version crowded the captions
 * > and forced the headline larger than the page could hold.
 *
 * **The two doors carry no captions.** What each path needs is stated on its
 * own first screen, and repeating it here was the crowding. Most visitors are
 * claimants, but a guardian must never have to hunt — so the doors sit
 * adjacent, filled terracotta against olive outline, not primary and footnote.
 *
 * **The owner message is third and deliberately dull.** It exists to end a
 * visit, not to start one — and saying that a browser *cannot* open a vault is
 * the encryption promise doing its own marketing.
 *
 * Renders fully without JavaScript.
 */
export default async function Page() {
  const labels = t(HOME, await getLocale())

  return (
    <SiteShell bleed>
      <div className="mx-auto max-w-[1280px]">
        <div className="px-[22px] pt-[30px] pb-[34px] md:px-11 md:pt-[72px] md:pb-16">
          {/* Rule and eyebrow. The rule is a bar, not a dash — it reads as a
              mark of place rather than punctuation. */}
          <div className="mb-6 flex items-center gap-3 md:mb-[38px] md:gap-3.5">
            <span
              aria-hidden
              className="bg-primary h-1 w-[42px] shrink-0 rounded-full md:w-[54px]"
            />
            <span className="text-terracotta-700 text-[12.5px] font-semibold whitespace-nowrap md:text-[14px]">
              {labels.eyebrow}
            </span>
          </div>

          {/* The second line takes the accent. Colour inside the type rather
              than behind it — the board grounds the page on sand and spends
              terracotta on the words, the action and one bar. */}
          <h1 className="mb-[22px] text-[46px] leading-[1.1] font-black tracking-[-0.02em] md:mb-7 md:text-[72px] md:leading-[1.08]">
            {labels.heroLineOne}
            <br />
            <span className="text-primary">{labels.heroLineTwo}</span>
          </h1>

          <p className="mb-8 max-w-[600px] text-[16.5px] leading-[1.7] opacity-[.76] md:mb-11 md:text-[19px] md:leading-[1.68]">
            {labels.heroBody}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row md:gap-3.5">
            <Link
              href="/claim"
              className="bg-primary text-primary-foreground hover:bg-terracotta-600 font-heading inline-flex h-[60px] items-center justify-center gap-[11px] rounded-full px-8 text-[17px] font-extrabold whitespace-nowrap transition-colors md:h-[68px] md:px-[38px] md:text-[19px]"
            >
              {labels.claimAction}
              {/* Points the way the reader is going: leftward in Arabic, and
                  flipped back for English. */}
              <ArrowRightIcon
                className="size-5 rtl:-scale-x-100 md:size-[21px]"
                strokeWidth={2.75}
                aria-hidden
              />
            </Link>
            <Link
              href="/claim/guardian"
              className="border-secondary text-olive-700 hover:bg-olive-100 font-heading inline-flex h-[60px] items-center justify-center rounded-full border-2 px-7 text-[17px] font-extrabold whitespace-nowrap transition-colors md:h-[68px] md:px-[34px] md:text-[19px]"
            >
              {labels.guardianAction}
            </Link>
          </div>
        </div>

        {/* The one solid field on the page. It separates the offer from the
            aside without a border and without a second surface colour. */}
        <div aria-hidden className="bg-primary h-[14px]" />

        <div className="px-[22px] pt-[26px] pb-[34px] md:px-11">
          <div className="bg-muted flex flex-col gap-4 rounded-[26px] p-[26px] md:flex-row md:items-center md:gap-[26px] md:px-8">
            <span className="bg-accent text-accent-foreground grid size-[46px] shrink-0 place-items-center rounded-[14px]">
              <SmartphoneIcon className="size-[22px]" strokeWidth={2.75} aria-hidden />
            </span>
            <div className="flex-1">
              <div className="font-heading mb-1.5 text-[17px] font-extrabold md:text-[19px]">
                {labels.ownerTitle}
              </div>
              <p className="text-[14.5px] leading-[1.65] opacity-75">
                {labels.ownerBody}
              </p>
            </div>
            <span className="hover:bg-sand-200 shrink-0 self-start rounded-full border-[1.5px] border-[color:var(--border)] px-[26px] py-[15px] text-[14.5px] font-semibold whitespace-nowrap transition-colors md:self-auto">
              {labels.ownerAction}
            </span>
          </div>
        </div>
      </div>
    </SiteShell>
  )
}
