import type { Metadata } from "next"

import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { ReceiveEntry } from "@/features/handover/components/receive-entry"
import { DELIVERY } from "@/features/handover/strings/delivery"

/**
 * ⚠️ **Never indexed.** The token is a capability sent to one executor's phone.
 * Holding it opens nothing — identity and the sheet do — and the page names
 * nobody, but a crawler has no business holding it either.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: t(DELIVERY, await getLocale()).pageTitle,
    robots: { index: false, follow: false },
  }
}

/** The link in the message Wassiya sends each executor after release. Public. */
export default async function ReceivePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <ReceiveEntry token={token} />
}
