import type { Metadata } from "next"

import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { Conversation } from "@/features/support/components/conversation"
import { SUPPORT } from "@/features/support/strings/support"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: t(SUPPORT, await getLocale()).chatTitle,
    robots: { index: false, follow: false },
  }
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
