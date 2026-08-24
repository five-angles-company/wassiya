import { CLAIM_STATUS } from "@/lib/claim-copy"
import { fmtArabicDate } from "@/lib/format-ar"

export type ClaimTimelineProps = {
  identityVerified: boolean
  certificateReceived: boolean
  guardianConfirmed: boolean
  status: string
  deadline: number | null
  className?: string
}

type StepState = "done" | "current" | "future"

/**
 * The five steps of a claim, with the one that is happening now marked.
 *
 * **The notification step is not optional and is never hidden.** Telling the
 * claimant that the account holder has been contacted on every channel is the
 * "radical transparency" the board asks for. Omitting it would be more
 * comfortable — nobody enjoys being told they are being checked on — but a
 * relative who later discovers the owner was warned, and was not told so here,
 * has been deceived by omission. That is the failure mode this screen exists to
 * avoid.
 *
 * Server-rendered from server-computed state; no client JS.
 */
export function ClaimTimeline({
  identityVerified,
  certificateReceived,
  guardianConfirmed,
  status,
  deadline,
  className,
}: ClaimTimelineProps) {
  const inVeto = status === "awaiting_veto"
  const inGuardian = status === "guardian_review"

  const steps: { label: string; meta?: string; state: StepState }[] = [
    {
      label: CLAIM_STATUS.stepReceived,
      state: identityVerified ? "done" : "current",
    },
    {
      label: CLAIM_STATUS.stepNotified,
      meta: CLAIM_STATUS.stepNotifiedMeta,
      state: certificateReceived || inVeto ? "done" : "future",
    },
    {
      label: CLAIM_STATUS.stepVeto,
      meta:
        deadline === null
          ? undefined
          : CLAIM_STATUS.vetoEnds.replace(
              "{date}",
              fmtArabicDate(new Date(deadline))
            ),
      state: inVeto ? "current" : inGuardian ? "done" : "future",
    },
    {
      label: CLAIM_STATUS.stepGuardian,
      meta: CLAIM_STATUS.stepGuardianMeta,
      state: guardianConfirmed ? "done" : inGuardian ? "current" : "future",
    },
    {
      label: CLAIM_STATUS.stepRelease,
      meta: CLAIM_STATUS.stepReleaseMeta,
      state: "future",
    },
  ]

  return (
    <ol className={className}>
      {steps.map((step, index) => (
        <li key={step.label} className="flex gap-3.5">
          {/* The rail: a marker, and a line to the next step. Drawn with
              logical spacing so it mirrors correctly under RTL. */}
          <div className="flex flex-col items-center">
            <span
              aria-hidden
              className={
                step.state === "done"
                  ? "bg-olive-600 mt-1 size-3.5 shrink-0 rounded-full"
                  : step.state === "current"
                    ? "bg-terracotta-600 ring-terracotta-200 mt-1 size-3.5 shrink-0 rounded-full ring-4"
                    : "border-sand-400 mt-1 size-3.5 shrink-0 rounded-full border-2"
              }
            />
            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className={
                  step.state === "done"
                    ? "bg-olive-300 w-0.5 grow"
                    : "bg-sand-300 w-0.5 grow"
                }
              />
            ) : null}
          </div>

          <div className={index < steps.length - 1 ? "pb-6" : ""}>
            <p
              className={
                step.state === "future"
                  ? "text-sand-600 text-[14.5px] leading-[1.5]"
                  : "text-[14.5px] leading-[1.5] font-semibold"
              }
            >
              {step.label}
            </p>
            {step.meta ? (
              <p className="text-sand-600 mt-1 text-[12.5px] leading-[1.6]">
                {step.meta}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
