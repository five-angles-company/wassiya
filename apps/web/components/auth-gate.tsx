"use client"

import type { ReactNode } from "react"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { AuthLoading, Authenticated, useQuery } from "convex/react"

/**
 * The gate.
 *
 * This is a **UX** gate, not a security boundary. The boundary is
 * `getCurrentUserOrThrow` / `requireUser` inside every function this app calls;
 * someone who forced their way past this component would see a shell full of
 * failed queries and no data. What it buys is that they see a skeleton instead
 * of a flicker.
 *
 * Unlike the console's, there is **no role check**. Every signed-in person
 * belongs here — an heir, a reporter, or someone about to become one by opening
 * an invitation. What differs between them is which sections the sidebar
 * renders, not whether they may enter.
 *
 * It gates on Convex's auth state rather than Clerk's, per the repo rule: Clerk
 * can consider a client signed in a beat before Convex has minted its token,
 * and `api.users.me` returns `null` in that window. Treating that `null` as
 * "not allowed" would bounce every legitimate reader on every cold load.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <GateSkeleton />
      </AuthLoading>
      <Authenticated>
        <SyncCheck>{children}</SyncCheck>
      </Authenticated>
    </>
  )
}

function SyncCheck({ children }: { children: ReactNode }) {
  const me = useQuery(api.users.me)

  // `undefined` is the query in flight; `null` is Convex authenticated but the
  // Clerk sync webhook not yet landed. Both are "not yet", never "not allowed".
  if (me === undefined || me === null) return <GateSkeleton />

  return <>{children}</>
}

function GateSkeleton() {
  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
