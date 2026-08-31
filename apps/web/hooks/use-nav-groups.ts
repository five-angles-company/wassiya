"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"

import { NAV_GROUPS, type Audience, type NavGroup } from "@/config/nav"

/**
 * Which parts of the nav exist for the person looking.
 *
 * `guardianFor` and `claims.mine` decide. Someone who guards a vault but has
 * never filed sees no box; someone who filed but guards nothing sees no
 * guardianship. Both, either, or neither are all normal — and a link rendered
 * dead would be the worse answer, because on this product an empty "what was
 * left to you" reads as a bereavement, not a state.
 *
 * ## The filter is per item, not per group
 *
 * It was per group, and that produced a bar with **one link** on it for a
 * brand-new account — which reads as a broken app rather than as an empty one.
 * The fault was treating "heir" as a property of the whole section: filing a
 * report is the one thing any signed-in reader can do from a standing start, so
 * "بلاغاتي" and "بلاغ جديد" are marked `everyone` and only "صندوقي" still waits
 * for a claim to exist. A group with nothing left in it drops out entirely.
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
