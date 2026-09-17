"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"

import { NAV_GROUPS, type Audience, type NavGroup } from "@/config/nav"

/**
 * Which parts of the nav exist for the person looking. `guardianFor` and
 * `claims.mine` decide; both, either, or neither are all normal. A link rendered
 * dead would be the worse answer, because an empty "what was left to you" reads
 * as a bereavement rather than a state.
 *
 * **The filter is per item, not per group.** Per group produced a bar with one
 * link on it for a brand-new account, which reads as a broken app: filing a
 * report is the one thing any signed-in reader can do from a standing start, so
 * "بلاغاتي" and "بلاغ جديد" are `everyone` and only "صندوقي" waits for a claim.
 * A group with nothing left in it drops out entirely.
 *
 * **While either query is in flight, both sections are returned.** A bar whose
 * links appear one at a time as subscriptions land reads as broken, and the
 * links it briefly shows are all real routes that gate themselves server-side.
 *
 * A hook rather than a prop, because the bar and the mobile menu must never
 * disagree about who is looking. Convex dedupes the two subscriptions.
 */
export function useNavGroups(): readonly NavGroup[] {
  const guardianships = useQuery(api.guardians.guardianFor, {})
  const claims = useQuery(api.claims.mine, {})

  const loading = guardianships === undefined || claims === undefined
  const isGuardian = loading || guardianships.length > 0
  const isHeir = loading || claims.length > 0

  const allowed = (audience: Audience) =>
    audience === "everyone"
      ? true
      : audience === "guardian"
        ? isGuardian
        : isHeir

  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => allowed(item.audience ?? group.audience)),
  })).filter((group) => group.items.length > 0)
}
