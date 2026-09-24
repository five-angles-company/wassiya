import type { Metadata } from "next"

import { Conversation } from "@/features/support/components/conversation"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/** Access is decided by the backend: the caller's session or guest token. */
export default async function SupportThreadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <Conversation threadId={id} />
}
