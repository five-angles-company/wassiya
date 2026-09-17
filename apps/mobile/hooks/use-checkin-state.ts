/**
 * The check-in, reduced to what Home needs to draw.
 *
 * Reads `escalationState`, never the clock. A Convex query is not re-run because
 * time passed, so `Date.now() >= nextDueAt` in a component is only as fresh as
 * the last render — and goes stale precisely at the moment it matters, on a
 * screen someone left open. `escalationState` is the server's materialised
 * answer, advanced by the sweep cron and delivered through the subscription.
 *
 *   idle                      → confirmed   nothing is due
 *   day0                      → due         the first prompt has fired
 *   day7 · day14 · countdown  → overdue     escalation is under way
 *
 * `overdue` deliberately does not distinguish day 7 from the release countdown.
 * 6.3 explains the ladder; an owner who sees "overdue" needs to do exactly one
 * thing regardless of which rung they are on.
 */
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { CheckInHeroState } from "@workspace/ui-native/components/wassiya/check-in-hero"
import { fmtDate } from "@workspace/ui-native/lib/format"

import { useStrings } from "@/i18n/use-strings"

export type CheckInState = {
  state: CheckInHeroState
  /** The supporting line, already formatted. Absent when there's nothing to add. */
  detail?: string
  /** Still loading — render the hero in its calm state rather than flashing. */
  loading: boolean
}

export function useCheckInState(): CheckInState {
  const { t, locale } = useStrings("home")
  const config = useQuery(api.checkin.get)

  if (config === undefined) {
    return { state: "confirmed", loading: true }
  }
  if (config === null) {
    return { state: "off", loading: false }
  }

  if (config.escalationState === "idle") {
    return {
      state: "confirmed",
      // Absolute dates rather than "3 days ago". The cadence is quarterly, so
      // a relative phrase is both vaguer and — being derived from a clock this
      // hook has just refused to trust — less honest.
      detail: t.checkinConfirmed
        .replace("{last}", fmtDate(new Date(config.lastConfirmedAt), locale))
        .replace("{next}", fmtDate(new Date(config.nextDueAt), locale)),
      loading: false,
    }
  }

  return config.escalationState === "day0"
    ? { state: "due", detail: t.checkinDue, loading: false }
    : { state: "overdue", detail: t.checkinOverdue, loading: false }
}
