import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"

import { AuthGate } from "@/components/auth-gate"
import { safePath } from "@/lib/safe-path"
import { HeirBox } from "@/features/box/components/heir-box"

/**
 * ⚠️ Never indexed, for the same reason as the case page it sits under: the
 * claim id is the capability.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * The box, and the gate in front of it.
 *
 * ## This page gates itself, and it is the only one in `(case)` that does
 *
 * The group exists so a case can be **read** without an account. A box cannot:
 * `release.releasedBundleForHeir` asserts the caller is the claimant, so an
 * anonymous reader gets an opaque failure where a sign-in prompt is the honest
 * answer. The gate lives here rather than on the group, because moving it up
 * would take the public case page with it.
 *
 * `AuthGate` is the second half — Clerk being signed in is not the same as
 * Convex having caught up, and the mutation is Convex's.
 *
 * ## A child route, not a step inside the case
 *
 * Three reasons that all point the same way. It holds decrypted DEKs whose
 * lifetime `heir-box.tsx` scopes to the component's mount, and a route boundary
 * is what guarantees that unmount. `BoxGate` is a full-viewport argument rather
 * than a card — its heading is the claim the whole product rests on. And the
 * case page must render for a signed-out reader while this must not.
 *
 * No page header: the gate *is* the screen. Wrapping it in generic chrome would
 * demote it to a form.
 */
export default async function BoxPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { isAuthenticated } = await auth()
  if (!isAuthenticated) {
    const here = safePath((await headers()).get("x-pathname"))
    redirect(`/sign-in?redirect_url=${encodeURIComponent(here)}`)
  }

  return (
    <AuthGate>
      <HeirBox claimId={id} />
    </AuthGate>
  )
}
