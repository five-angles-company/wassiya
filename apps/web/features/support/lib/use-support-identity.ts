"use client"

import { useSyncExternalStore } from "react"
import { useConvexAuth } from "convex/react"

import { guestToken } from "@/features/support/lib/guest-token"

const noop = () => () => {}

/**
 * Who the support functions should see: the Convex session when there is one,
 * the browser's guest token otherwise. `ready` is false until Convex has
 * settled, so a signed-in reader is never briefly treated as a guest.
 */
export function useSupportIdentity(): {
  ready: boolean
  signedIn: boolean
  /** Pass straight through as the `guestToken` argument. */
  guestToken: string | undefined
} {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const token = useSyncExternalStore(noop, guestToken, () => null)
  const ready = !isLoading && (isAuthenticated || token !== null)
  return {
    ready,
    signedIn: isAuthenticated,
    guestToken: isAuthenticated ? undefined : (token ?? undefined),
  }
}
