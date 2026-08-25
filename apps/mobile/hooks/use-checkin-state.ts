/**
 * The check-in, reduced to what Home needs to draw.
 *
 * ## Why this reads `escalationState` and never the clock
 *
 * `convex/checkin.ts` is explicit about it: a Convex query is not re-run
 * because time passed. So `Date.now() >= nextDueAt` evaluated in a component
 * is only as fresh as the last render — and it goes stale *precisely* at the
 * moment it matters, on a screen someone left open. `escalationState` is the
 * server's own materialised answer, advanced by the sweep cron, and it changes
 * through the subscription like any other field.
 *
 * The five server states collapse to four display states:
 *
 *   idle                      → confirmed   nothing is due
 *   day0                      → due         the first prompt has fired
 *   day7 · day14 · countdown  → overdue     escalation is under way
 *
 * `overdue` deliberately does not distinguish day 7 from the release
 * countdown. Home is not the place to explain the ladder — 6.3 is — and an
 * owner who sees "overdue" needs to do exactly one thing regardless of which
 * rung they're on.
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
