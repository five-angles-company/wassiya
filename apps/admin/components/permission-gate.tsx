"use client"

import type { ReactNode } from "react"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { NotAuthorised } from "@/components/not-authorised"
import { usePermissions } from "@/hooks/use-permissions"

/**
 * A screen only some staff may open.
 *
 * ⚠️ **UX, not a boundary.** Every query behind these screens gates itself with
 * `requirePermission`, so someone who typed the URL sees a refusal either way —
 * this is what makes it a sentence instead of a wall of failed queries.
 *
 * The in-flight case renders a skeleton rather than the refusal, for the same
 * reason `AdminGate` does: treating "not yet" as "not allowed" flashes an
 * accusation at every legitimate operator on every cold load.
 */
export function RequirePermission({
  need,
  children,
}: {
  need: string
  children: ReactNode
}) {
  const { loading, has } = usePermissions()
  if (loading) return <PageSkeleton />
  if (!has(need)) return <NotAuthorised />
  return <>{children}</>
}

/**
 * One control only some staff may use.
 *
 * Renders nothing at all rather than a disabled button: a greyed-out "approve"
 * invites the question "why can't I?", which is a support ticket, where an
 * absent one reads as "not my job", which is the truth.
 */
export function IfPermitted({
  need,
  children,
}: {
  need: string
  children: ReactNode
}) {
  const { has } = usePermissions()
  if (!has(need)) return null
  return <>{children}</>
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
