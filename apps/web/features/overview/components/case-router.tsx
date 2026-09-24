"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"

import { useLocale } from "@/components/locale-provider"
import { Placeholder } from "@/components/placeholder"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { CaseList } from "@/features/overview/components/case-list"
import { WelcomeDoors } from "@/features/overview/components/welcome-doors"

/**
 * The front door — a router, not a screen.
 *
 * Almost everyone here has exactly one thing in flight: one report they filed,
 * or one delivery waiting for them. For them a home screen is a menu with a
 * single item, so `/` sends them there.
 *
 * | reports | deliveries | what happens     |
 * | ------- | ---------- | ---------------- |
 * | 0       | 0          | `WelcomeDoors`   |
 * | 1       | 0          | → that report    |
 * | 0       | 1          | → that delivery  |
 * | more than one thing  | `CaseList`       |
 *
 * Three rules the redirect depends on:
 *  - **Never decide while any query is `undefined`.** A decision on partial
 *    data sends the reader to the wrong place without them knowing.
 *  - **`replace`, not `push`.** Left in the back stack, "back" from a case
 *    lands on `/`, which immediately routes forward again.
 *  - **Fire once.** Subscriptions re-fire on any change; a second `replace`
 *    mid-navigation is a flicker at best.
 */
export function CaseRouter() {
  const router = useRouter()
  const sent = useRef(false)
  const loadingLabel = t(COMMON, useLocale()).loading

  const me = useQuery(api.users.me, {})
  const cases = useQuery(api.claims.mine, {})
  const deliveries = useQuery(api.deliveries.mine, {})

  const loading = cases === undefined || deliveries === undefined

  const destination =
    loading || cases.length + deliveries.length !== 1
      ? null
      : cases.length === 1
        ? `/case/${cases[0]!.id}`
        : `/delivery/${deliveries[0]!.deliveryId}`

  useEffect(() => {
    if (destination === null || sent.current) return
    sent.current = true
    router.replace(destination)
  }, [destination, router])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Placeholder label={loadingLabel} className="h-12 w-1/2 rounded-full" />
        <Placeholder label={loadingLabel} />
      </div>
    )
  }

  // Mid-navigation. The skeleton rather than the list, so the list is never
  // shown for a frame to somebody who is being sent past it.
  if (destination !== null) {
    return <Placeholder label={loadingLabel} />
  }

  if (cases.length === 0 && deliveries.length === 0) {
    return <WelcomeDoors name={me?.name ?? null} />
  }

  return (
    <CaseList cases={cases} deliveries={deliveries} name={me?.name ?? null} />
  )
}
