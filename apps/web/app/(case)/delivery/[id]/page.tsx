import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"

import { AuthGate } from "@/components/auth-gate"
import { HelpLink } from "@/components/help-link"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { safePath } from "@/lib/safe-path"
import { IdentityPanel } from "@/features/claims/components/identity-panel"
import { ExecutorDelivery } from "@/features/handover/components/executor-delivery"
import { DELIVERY } from "@/features/handover/strings/delivery"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: t(DELIVERY, await getLocale()).pageTitle,
    robots: { index: false, follow: false },
  }
}

/**
 * One executor's delivery. Gated here rather than on the `(case)` group,
 * because the group's report pages must stay readable signed out while this
 * one holds decrypted keys. `AuthGate` is the second half: Clerk being signed
 * in is not Convex having caught up, and every read here is Convex's.
 *
 * A child route of nothing, so the DEKs `ExecutorHandover` holds are scoped to
 * this page's mount and wiped when the reader leaves it.
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
      <ExecutorDelivery
        deliveryId={id}
        identity={<IdentityPanel returnTo={`/delivery/${id}`} />}
      />
      <HelpLink locale={await getLocale()} topic="delivery" deliveryId={id} />
    </AuthGate>
  )
}
