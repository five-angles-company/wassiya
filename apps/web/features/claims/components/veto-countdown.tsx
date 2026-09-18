"use client"

import { useEffect, useState } from "react"

import { useLocale } from "@/components/locale-provider"
import { fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { CLAIM_STATUS } from "@/features/claims/strings/claim-status"

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Days left in the objection period.
 *
 * ## Why the clock is read in an effect and not during render
 *
 * A Convex query does not re-run because time passed, so the deadline has to
 * arrive as a timestamp and be turned into a count on the client. `Date.now()`
 * during render is impure — two renders of the same props would disagree, and
 * React is entitled to render twice — so it is read once on mount and then on a
 * daily tick.
 *
 * Before the first effect runs there is no count. The row is simply absent for
 * that frame rather than showing a zero, because "٠ يوماً متبقياً" on a claim
 * with three weeks to run is the one wrong answer this component could give.
 *
 * ## It does not count down in seconds
 *
 * Nothing here pulses or ticks. This is a month-long
 * wait read by someone anxious; a live counter turns a calm page into a clock
 * they will watch.
 */
export function VetoCountdown({ deadline }: { deadline: number }) {
  const locale = useLocale()
  const labels = t(CLAIM_STATUS, locale)
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    const read = () =>
      setDays(Math.max(0, Math.ceil((deadline - Date.now()) / DAY_MS)))
    read()
    const timer = setInterval(read, DAY_MS)
    return () => clearInterval(timer)
  }, [deadline])

  if (days === null) return null

  return (
    <p className="mt-4 text-[15px] font-semibold">
      <span className="font-heading text-[26px] font-black">
        {fmtNumber(days, locale)}
      </span>{" "}
      {labels.daysLeft}
    </p>
  )
}
