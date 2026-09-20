"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { AuthLoading, Authenticated, useMutation, useQuery } from "convex/react"

import { NotAuthorised } from "@/components/not-authorised"

/**
 * The door to the console.
 *
 * This is a **UX** gate, not a security boundary. The boundary is
 * `requirePermission` inside every staff function, which re-derives the caller
 * from the Clerk JWT and throws — so somebody who forced their way past this
 * component would see a console full of failed queries and no data. What this
 * buys is that they see a sentence instead.
 *
 * It gates on Convex's auth state rather than Clerk's, per the repo rule: Clerk
 * can consider a client signed in a beat before Convex has minted its token,
 * and `api.staff.me` returns `null` in that window. Treating that `null` as
 * "no permissions" would flash the refusal panel at every legitimate operator
 * on every cold load.
 *
 * Holding *any* permission is what opens the door; which screens are inside is
 * the sidebar's business and each page's `RequirePermission`.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <GateSkeleton />
      </AuthLoading>
      <Authenticated>
        <StaffCheck>{children}</StaffCheck>
      </Authenticated>
    </>
  )
}

function StaffCheck({ children }: { children: ReactNode }) {
  const me = useQuery(api.staff.me)
  const claim = useMutation(api.staff.claimInvitation)
  const claimed = useRef(false)

  // The second of the two invitation doors. Somebody invited *after* they
  // already had an account produces no Clerk webhook, so nothing ever binds
  // their invitation — this picks it up on their next visit. Guarded by a ref
  // rather than state: the mutation patches the user row, which re-runs the
  // query above, which would otherwise re-enter this effect.
  useEffect(() => {
    if (me?.pendingInvitation !== true || claimed.current) return
    claimed.current = true
    void claim({})
  }, [me?.pendingInvitation, claim])

  // `undefined` is the query in flight; `null` is Convex authenticated but the
  // user row not synced yet. Both are "not yet", never "not allowed".
  if (me === undefined || me === null) return <GateSkeleton />
  if (me.permissions.length === 0) {
    // An invitation is mid-flight — a beat of skeleton beats a refusal that
    // resolves into a console a second later.
    if (me.pendingInvitation) return <GateSkeleton />
    return <NotAuthorised />
  }

  return <>{children}</>
}

function GateSkeleton() {
  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
