"use client"

import type { ReactNode } from "react"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { AuthLoading, Authenticated, useQuery } from "convex/react"

import { NotAuthorised } from "@/components/not-authorised"

/**
 * The role gate.
 *
 * This is a **UX** gate, not a security boundary. The boundary is `requireAdmin`
 * inside every admin function, which re-derives the caller from the Clerk JWT
 * and throws — so a non-admin who forced their way past this component would
 * see a console full of failed queries and no data. What this buys is that they
 * see a sentence instead.
 *
 * It gates on Convex's auth state rather than Clerk's, per the repo rule: Clerk
 * can consider a client signed in a beat before Convex has minted its token,
 * and `api.users.me` returns `null` in that window. Treating that `null` as
 * "not an admin" would flash the refusal panel at every legitimate reviewer on
 * every cold load.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <GateSkeleton />
      </AuthLoading>
      <Authenticated>
        <RoleCheck>{children}</RoleCheck>
      </Authenticated>
    </>
  )
}

function RoleCheck({ children }: { children: ReactNode }) {
  const me = useQuery(api.users.me)

  // `undefined` is the query in flight; `null` is Convex authenticated but the
  // user row not synced yet. Both are "not yet", never "not allowed".
  if (me === undefined || me === null) return <GateSkeleton />
  if (me.role !== "admin") return <NotAuthorised />

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
