"use client"

import { useMemo } from "react"
import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"

/**
 * What the signed-in operator may do.
 *
 * One subscription, shared by the whole shell: `staff.me` is a live query, so
 * an Owner changing someone's roles collapses that person's sidebar without a
 * refresh — the backend patches their user row, the query re-runs, and every
 * `has()` in the tree answers differently.
 *
 * ⚠️ **UX only.** The boundary is `requirePermission` in the Convex function.
 * Hiding a button proves nothing; it just stops staff walking into a refusal.
 */
export type Permissions = {
  /** The query is still in flight. Render skeletons, never a refusal. */
  loading: boolean
  has: (key: string) => boolean
  isOwner: boolean
  permissions: readonly string[]
  pendingInvitation: boolean
}

export function usePermissions(): Permissions {
  const me = useQuery(api.staff.me)

  return useMemo(() => {
    const permissions = me?.permissions ?? []
    const all = permissions.includes("*")
    return {
      loading: me === undefined,
      has: (key: string) => all || permissions.includes(key),
      isOwner: all,
      permissions,
      pendingInvitation: me?.pendingInvitation ?? false,
    }
  }, [me])
}
