"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"

import { NAV_GROUPS, type NavGroup } from "@/config/nav"

/**
 * Which sections of the nav exist for the person looking.
 *
 * `guardianFor` and `claims.mine` decide. Someone who guards a vault but has
 * never filed sees no reports links; someone who filed but guards nothing sees
 * no guardianship. Both, either, or neither are all normal — and a section
 * rendered empty would be the worse answer, because on this product an empty
 * "what was left to you" reads as a bereavement, not a state.
 *
 * **While either query is in flight, both sections are returned.** A bar whose
 * links appear one at a time as subscriptions land reads as broken, and the
 * links it briefly shows are all real routes that gate themselves server-side.
 * Erring toward showing is the cheaper mistake.
 *
 * A hook rather than a prop, because the bar and the mobile menu are separate
 * components that must never disagree about who is looking. Convex dedupes the
 * two subscriptions, so asking twice costs one of each.
 */
export function useNavGroups(): readonly NavGroup[] {
  const guardianships = useQuery(api.guardians.guardianFor, {})
  const claims = useQuery(api.claims.mine, {})

  const loading = guardianships === undefined || claims === undefined
  const isGuardian = loading || guardianships.length > 0
  const isHeir = loading || claims.length > 0

  return NAV_GROUPS.filter((group) =>
    group.audience === "everyone"
      ? true
      : group.audience === "guardian"
        ? isGuardian
        : isHeir
  )
}
