import type { Metadata } from "next"

import { AcceptFlow } from "@/components/guardian/accept-flow"
import { SiteShell } from "@/components/shell/site-shell"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { GUARDIAN } from "@/lib/i18n/strings/guardian"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: t(GUARDIAN, await getLocale()).metaTitle,
    robots: { index: false, follow: false },
  }
}

/**
 * Where a guardian's emailed invitation lands.
 *
 * Inside the same shell as everything else, deliberately: a guardian following
 * a link from someone they know must arrive somewhere that is visibly the same
 * product, not a bare token-redemption page.
 *
 * The owner's name is not read here. `guardians.accept` matches on the invite
 * token alone and returns the subject only after acceptance, so naming them
 * before the guardian has committed would need a public query keyed on a token
 * — a lookup oracle for anyone guessing tokens. The invitation email carries
 * the name; this page says "someone".
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const labels = t(GUARDIAN, await getLocale())

  if (token === undefined || token.length === 0) {
    return (
      <SiteShell width="prose">
        <p className="text-[17px] leading-[1.7] opacity-80">{labels.noToken}</p>
      </SiteShell>
    )
  }

  return (
    <SiteShell>
      <AcceptFlow token={token} ownerName={labels.someone} />
    </SiteShell>
  )
}
