"use client"

import { ClaimBrand } from "@/components/claim/claim-brand"
import { useLocale } from "@/components/locale-provider"
import { fmtStepNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { CLAIM } from "@/lib/i18n/strings/claim"

export type ClaimStepperProps = {
  /** 1-based: identity · certificate · waiting. */
  current: 1 | 2 | 3
  /** The human-quotable reference, when a claim exists. */
  reference?: string
  children: React.ReactNode
}

/**
 * The three-step chrome for ٧.٢ and ٧.٣.
 *
 * The step count is shown from the first screen onward because the board's 7.1
 * already promised "٣ خطوات · نحو ١٠ دقائق" — a funnel that announces three
 * steps and then hides where you are in them reads as though it is stalling,
 * which is the exact impression this whole section is written to avoid.
 *
 * The reference appears as soon as a claim exists, so someone who abandons the
 * tab has something to quote to support.
 */
export function ClaimStepper({
  current,
  reference,
  children,
}: ClaimStepperProps) {
  const locale = useLocale()
  const labels = t(CLAIM, locale)
  const stepLabels = [
    labels.stepperIdentity,
    labels.stepperCertificate,
    labels.stepperWaiting,
  ]

  return (
    <div className="min-h-screen pb-16">
      <ClaimBrand />

      <div className="mx-auto max-w-3xl px-5 pt-6 md:px-8">
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {stepLabels.map((label, index) => {
            const step = index + 1
            const done = step < current
            const active = step === current
            return (
              <li key={label} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={
                    done
                      ? "bg-olive-600 flex size-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      : active
                        ? "bg-terracotta-700 flex size-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                        : "border-sand-400 text-sand-600 flex size-5 items-center justify-center rounded-full border text-[11px]"
                  }
                >
                  {done ? "✓" : fmtStepNumber(step, locale)}
                </span>
                <span
                  className={
                    active
                      ? "text-[13.5px] font-semibold"
                      : "text-sand-600 text-[13.5px]"
                  }
                >
                  {label}
                </span>
                {step < 3 ? (
                  <span aria-hidden className="bg-sand-300 mx-1 h-px w-6" />
                ) : null}
              </li>
            )
          })}
          {reference !== undefined ? (
            <li className="text-sand-600 ms-auto text-[12.5px]">
              <span className="ltr-isolate">{reference}</span>
            </li>
          ) : null}
        </ol>

        <main className="mt-8">{children}</main>
      </div>
    </div>
  )
}

