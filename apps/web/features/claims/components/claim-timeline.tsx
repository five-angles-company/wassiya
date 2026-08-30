import {
  CheckIcon,
  HourglassIcon,
  InboxIcon,
  PackageIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { CLAIM_STATUS } from "@/features/claims/strings/claim-status"

export type ClaimTimelineProps = {
  identityVerified: boolean
  certificateReceived: boolean
  guardianConfirmed: boolean
  status: string
  deadline: number | null
  submittedAt: number
  locale: Locale
}

type State = "done" | "now" | "future"

/**
 * The five steps of a claim.
 *
 * **The notification step is never hidden and never de-emphasised.** It sits
 * second, in the same weight as everything else, because a relative who later
 * discovers the owner was warned — and was not told so here — has been deceived
 * at the moment they were deciding whether to trust us.
 *
 * The three states are carried by colour as well as position: an olive tick is
 * done and dated, terracotta is now and states the *reason* for the wait in
 * full, sand is not yet and says explicitly that nothing is needed from the
 * reader. Nothing pulses and nothing counts down.
 */
export function ClaimTimeline({
  identityVerified,
  certificateReceived,
  guardianConfirmed,
  status,
  deadline,
  submittedAt,
  locale,
}: ClaimTimelineProps) {
  const labels = t(CLAIM_STATUS, locale)
  const inVeto = status === "awaiting_veto"
  const inGuardian = status === "guardian_review"
  const filed = fmtDate(new Date(submittedAt), locale)
  const ends = deadline === null ? "—" : fmtDate(new Date(deadline), locale)

  const steps: {
    icon: typeof CheckIcon
    title: string
    meta: string
    state: State
  }[] = [
    {
      icon: InboxIcon,
      title: labels.stepReceived,
      meta: labels.stepReceivedMeta.replace("{date}", filed),
      state: identityVerified ? "done" : "now",
    },
    {
      icon: ShieldCheckIcon,
      title: labels.stepNotified,
      meta: labels.stepNotifiedMeta.replace("{date}", filed),
      state: certificateReceived || inVeto || inGuardian ? "done" : "future",
    },
    {
      icon: HourglassIcon,
      title: labels.stepVeto,
      meta: labels.stepVetoMeta.replace("{date}", ends),
      state: inVeto ? "now" : inGuardian ? "done" : "future",
    },
    {
      icon: CheckIcon,
      title: labels.stepGuardian,
      meta: labels.stepGuardianMeta,
      state: guardianConfirmed ? "done" : inGuardian ? "now" : "future",
    },
    {
      icon: PackageIcon,
      title: labels.stepRelease,
      meta: labels.stepReleaseMeta,
      state: "future",
    },
  ]

  return (
    <div className="flex flex-col">
      {steps.map((step, index) => {
        const Icon = step.state === "done" ? CheckIcon : step.icon
        const last = index === steps.length - 1
        return (
          <div key={step.title} className="flex gap-4">
            <div className="flex flex-none flex-col items-center">
              <span
                aria-hidden
                className={`grid size-9 place-items-center rounded-full ${
                  step.state === "done"
                    ? "bg-secondary text-secondary-foreground"
                    : step.state === "now"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card opacity-85"
                }`}
              >
                <Icon className="size-4" strokeWidth={2.5} />
              </span>
              {!last && (
                <span
                  aria-hidden
                  className={`min-h-[34px] w-[3px] flex-1 ${
                    step.state === "done"
                      ? "bg-secondary"
                      : step.state === "now"
                        ? "bg-primary"
                        : "bg-card"
                  }`}
                />
              )}
            </div>
            <div
              className={`flex-1 ${last ? "" : "pb-6"} ${
                step.state === "future" ? "opacity-55" : ""
              }`}
            >
              <div className="font-heading mb-1.5 text-[16px] font-extrabold">
                {step.title}
              </div>
              <div className="max-w-[440px] text-[14.5px] leading-[1.6] opacity-70">
                {step.meta}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
