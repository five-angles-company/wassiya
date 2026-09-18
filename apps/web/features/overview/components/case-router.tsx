"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"

import { CaseList } from "@/features/overview/components/case-list"
import { WelcomeDoors } from "@/features/overview/components/welcome-doors"

/**
 * The front door — a router, not a screen.
 *
 * Almost everyone here has exactly one thing in flight: one report, or one
 * guardianship. For them a home screen is a menu with a single item, and the
 * dashboard it replaced asked people to navigate to the only place they could
 * go. So `/` sends them there.
 *
 * | heir cases | duties | vaults | what happens        |
 * | ---------- | ------ | ------ | ------------------- |
 * | 0          | 0      | 0      | `WelcomeDoors`      |
 * | 1          | 0      | 0      | → that case         |
 * | 0          | 1      | any    | → that duty         |
 * | 0          | 0      | ≥1     | `GuardianStanding`  |
 * | more than one thing         | `CaseList`          |
 *
 * ## 🚨 The last row is a screen now, and used to be a redirect
 *
 * It sent this reader to `/guardian` — a route nothing else in the app linked
 * to, so it existed **only** for people with nothing to do. A guardian with a
 * duty waiting was routed past it by the row above, and then could not get back:
 * `PageTop` holds no destinations by design and the account menu had two items,
 * neither of them the key. The key check was unreachable in the week it matters.
 *
 * So the route is gone and its standing state renders here, where it belongs —
 * `WelcomeDoors` already plays the same part one row up. The key became
 * `/guardian/key`, reached from the account menu, so it no longer depends on
 * having nothing to do.
 *
 * ## ⚠️ The standing state arrives as a SLOT, not an import
 *
 * `eslint.config`'s `no-restricted-paths`: *"a feature may import itself and
 * nothing else under `features/`"* — so `features/overview` cannot reach into
 * `features/guardian`. The first version did and the rule caught it.
 *
 * Routes compose features; features do not reach across. So `app/(app)/page.tsx`
 * passes the node in and this file decides only **when** to show it. That is
 * also the honest shape: which screen a reader gets is this component's
 * question, and what a guardian's idle page contains is the guardian feature's.
 *
 * ## Three rules the redirect depends on
 *
 * **Never decide while any query is `undefined`.** Convex resolves them
 * independently, so a decision taken on partial data sends the reader to the
 * wrong place — and having arrived, they have no idea they were routed.
 *
 * **`replace`, not `push`.** `/` is a doorway. Left in the back stack, "back"
 * from a case lands on `/`, which immediately routes forward again — a trap the
 * reader cannot escape with the one control they will reach for.
 *
 * **Fire once.** Convex subscriptions re-fire on any change; a second `replace`
 * mid-navigation is a flicker at best.
 */
export function CaseRouter({
  guardianStanding,
}: {
  /** Rendered when this reader guards vaults and has nothing in flight. */
  guardianStanding: ReactNode
}) {
  const router = useRouter()
  const sent = useRef(false)

  const me = useQuery(api.users.me, {})
  const cases = useQuery(api.claims.mine, {})
  const duties = useQuery(api.guardians.pendingApprovals, {})
  const vaults = useQuery(api.guardians.guardianFor, {})

  const loading =
    cases === undefined || duties === undefined || vaults === undefined

  // The one destination, or `null` when this reader should see a screen.
  const destination =
    loading || cases.length + duties.length > 1
      ? null
      : cases.length === 1 && duties.length === 0
        ? `/case/${cases[0]!.id}`
        : duties.length === 1 && cases.length === 0
          ? `/guardian/${duties[0]!.claimId}`
          : null

  useEffect(() => {
    if (destination === null || sent.current) return
    sent.current = true
    router.replace(destination)
  }, [destination, router])

  if (loading) {
    return (
      <div className="flex flex-col gap-6" aria-hidden>
        <div className="bg-muted h-8 w-1/2 animate-pulse rounded" />
        <div className="border-border h-40 animate-pulse border-y" />
      </div>
    )
  }

  // Mid-navigation. The skeleton rather than the list, so the list is never
  // shown for a frame to somebody who is being sent past it.
  if (destination !== null) {
    return (
      <div className="border-border h-40 animate-pulse border-y" aria-hidden />
    )
  }

  if (cases.length === 0 && vaults.length === 0) {
    return <WelcomeDoors name={me?.name ?? null} />
  }

  /*
   * A guardian with nothing in flight. Below `WelcomeDoors` because a reader
   * with no vaults and no cases is being welcomed, not told they are idle — and
   * above `CaseList`, which needs something to list.
   */
  if (cases.length === 0 && duties.length === 0) {
    return guardianStanding
  }

  return (
    <CaseList cases={cases} duties={duties} name={me?.name ?? null} />
  )
}
