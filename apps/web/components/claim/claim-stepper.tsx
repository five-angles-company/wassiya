"use client"

import { BrandMark } from "@/components/shell/brand-mark"
import { useLocale } from "@/components/locale-provider"
import { fmtStepNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { NAV } from "@/lib/i18n/strings/nav"

export type ClaimStepperProps = {
  /** 1-based: identity · certificate · waiting. */
  current: 1 | 2 | 3
  children: React.ReactNode
}

/**
 * The mid-flow chrome: a mark, three bars, and a count.
 *
 * The board replaced a labelled stepper with this. Three 7px bars carry the
 * same information in a tenth of the space — and the labels were doing real
 * harm, because naming the steps meant naming *"الانتظار"* (waiting) to someone
 * who had not yet agreed to wait a month.
 *
 * No nav, no links, no wordmark. A row of exits halfway through filing a death
 * report is the one place the funnel's original no-chrome rule was literally
 * right, and the board keeps it.
 */
export function ClaimStepper({ current, children }: ClaimStepperProps) {
  const locale = useLocale()
  const labels = t(NAV, locale)

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-4 px-[22px] pt-[22px] md:gap-5 md:px-11">
        <BrandMark />
        <div className="flex flex-1 items-center gap-2.5" aria-hidden>
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              className={`h-[7px] flex-1 rounded-full ${
                step <= current ? "bg-primary" : "bg-card"
              }`}
            />
          ))}
        </div>
        <span className="shrink-0 text-[13.5px] font-semibold opacity-60">
          {labels.stepOf
            .replace("{n}", fmtStepNumber(current, locale))
            .replace("{total}", fmtStepNumber(3, locale))}
        </span>
      </div>

      <main
        id="content"
        className="mx-auto w-full max-w-[1280px] px-[22px] pt-[34px] pb-16 md:px-11"
      >
        {children}
      </main>
    </div>
  )
}
