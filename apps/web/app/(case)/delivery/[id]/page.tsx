import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"

import { AuthGate } from "@/components/auth-gate"
import { HelpLink } from "@/components/help-link"
import { getLocale } from "@/lib/i18n/server"
import { safePath } from "@/lib/safe-path"
import { HeirDelivery } from "@/features/box/components/heir-delivery"
import { IdentityPanel } from "@/features/claims/components/identity-panel"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * One heir's delivery. Gated here rather than on the `(case)` group, because
 * the group's report pages must stay readable signed out while this one holds
 * decrypted keys. `AuthGate` is the second half: Clerk being signed in is not
 * Convex having caught up, and every read here is Convex's.
 *
 * A child route of nothing, so the DEKs `HeirBox` holds are scoped to this
 * page's mount and wiped when the reader leaves it.
 */
export default async function DeliveryPage({
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
      <HeirDelivery
        deliveryId={id}
        identity={<IdentityPanel returnTo={`/delivery/${id}`} />}
      />
      <HelpLink locale={await getLocale()} topic="delivery" deliveryId={id} />
    </AuthGate>
  )
}
