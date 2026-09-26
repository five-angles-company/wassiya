import type { Metadata } from "next"

import { ReceiveEntry } from "@/features/handover/components/receive-entry"

/**
 * ⚠️ **Never indexed.** The token is a capability sent to one executor's phone.
 * Holding it opens nothing — identity and the sheet do — but it names the
 * deceased.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
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
