/**
 * Gathers the three pieces of evidence the resume logic in `lib/setup-flow`
 * needs, and reports which step they add up to.
 *
 * Auth is read from **Convex**, not Clerk. Clerk can consider a client signed
 * in a beat before Convex has minted and validated its own token, and every
 * query below would fail during that window — so `useConvexAuth` is the state
 * that decides whether the queries run at all.
 */
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/expo"
import { useConvexAuth, useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import { api } from "@workspace/backend/api"
import { usePathname } from "expo-router"

import { readEnrolment, type VaultEnrolment } from "@/lib/secure-vault"
import { resolveSetupStep, type SetupStep } from "@/lib/setup-flow"

export type SetupEvidenceResult = {
  /** True until every source has answered. Nothing may route before then. */
  loading: boolean
  step: SetupStep
  /** The keystore marker, for screens that need `deviceId` or the paper version. */
  enrolment: VaultEnrolment | null
  /** `users.me()`, or null while signed out. */
  me: FunctionReturnType<typeof api.users.me>
  /** `keyring.get()`, or null when no keyring row exists. */
  keyring: FunctionReturnType<typeof api.keyring.get>
  /** Re-read the keystore marker after a step writes one. */
  refresh: () => void
}

export function useSetupEvidence(): SetupEvidenceResult {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()

  // "skip" matters: both queries call `requireUser` and would throw while the
  // client is signed out, which surfaces as a render-time error rather than a
  // null result.
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip")
  const keyring = useQuery(api.keyring.get, isAuthenticated ? {} : "skip")

  // The keystore slot is the signed-in account's own; another account's key on
  // this phone is not evidence of anything for this one.
  const { isLoaded: clerkLoaded, userId: owner } = useAuth()

  // Tagged with the account it was read for, so a switch of accounts reads as
  // "loading" rather than routing one account on the other's marker.
  const [marker, setMarker] = useState<{
    owner: string | null
    value: VaultEnrolment | null
  } | null>(null)
  const [nonce, setNonce] = useState(0)

  // Re-read on every navigation. `me` and `keyring` are Convex queries and push
  // their own updates, but the keystore marker has no subscription — and the
  // setup layout mounts once and stays mounted for the whole run. Without
  // `pathname` here it would hold the value it read before MK existed, decide
  // the user was still on the explainer step, and bounce them off 2.4 forever.
  //
  // Cheap enough to do per hop: the marker is the *unauthenticated* key, so
  // this never raises a biometric prompt.
  const pathname = usePathname()

  useEffect(() => {
    if (!clerkLoaded) return
    let active = true
    const current = owner ?? null
    const read =
      current === null ? Promise.resolve(null) : readEnrolment(current)
    void read.then((value) => {
      // Sticky per account: a re-read for the same one replaces the value
      // without flipping `loading` back on, or every navigation inside /setup
      // would flash a spinner.
      if (active) setMarker({ owner: current, value })
    })
    return () => {
      active = false
    }
  }, [clerkLoaded, owner, nonce, pathname])

  const enrolmentLoaded = marker !== null && marker.owner === (owner ?? null)
  const enrolment = enrolmentLoaded ? marker.value : null

  const serverLoading =
    authLoading ||
    (isAuthenticated && (me === undefined || keyring === undefined))
  const loading = serverLoading || !clerkLoaded || !enrolmentLoaded

  const step = resolveSetupStep({
    signedIn: isAuthenticated,
    identity: me?.identityStatus ?? "unverified",
    keyring:
      keyring === undefined || keyring === null
        ? null
        : {
            paperVersion: keyring.paperVersion,
            wrapperVersion: keyring.wrapperVersion,
            paperPrintedAt: keyring.paperPrintedAt,
          },
    device: { hasMasterKey: enrolment !== null },
  })

  return {
    loading,
    step,
    enrolment,
    me: me ?? null,
    keyring: keyring ?? null,
    refresh: () => setNonce((n) => n + 1),
  }
}
