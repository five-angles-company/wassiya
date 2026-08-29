import { fmtStepNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { CLAIM } from "@/lib/i18n/strings/claim"

export type ClaimStep = {
  readonly label: string
  readonly meta?: string
}

/**
 * "What happens next", as a numbered list.
 *
 * Shown **before** the claimant starts, beside the CTA. Someone deciding
 * whether to begin needs to know up front that there is a thirty-day wait and
 * that the account holder will be told. Discovering either of those afterwards
 * is what makes a process feel like a trick, and this funnel is used by people
 * who are already braced for one.
 *
 * The marker is derived from the position rather than carried in the copy. It
 * used to be a literal "١" in the dictionary, which would have meant a second
 * language could disagree with the list it numbers — and it is the one string
 * on the page that is a fact about the list, not a translation.
 */
export function ClaimSteps({
  steps,
  locale,
}: {
  steps: readonly ClaimStep[]
  locale: Locale
}) {
  const labels = t(CLAIM, locale)

  return (
    <section className="bg-card rounded-card p-5">
      <h2 className="text-[17px]">{labels.stepsTitle}</h2>
      <ol className="mt-3 flex flex-col gap-3">
        {steps.map((step, index) => (
          <li key={step.label} className="flex items-start gap-3">
            <span
              aria-hidden
              className="bg-background text-terracotta-700 flex size-6 shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold"
            >
              {fmtStepNumber(index + 1, locale)}
            </span>
            <span className="text-[14.5px] leading-[1.55]">
              {step.label}
              {step.meta ? (
                <span className="text-sand-600 block text-[12.5px]">
                  {step.meta}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
