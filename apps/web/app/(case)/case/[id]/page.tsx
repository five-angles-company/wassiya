import type { Metadata } from "next"

import { HelpLink } from "@/components/help-link"
import { HeirCase } from "@/features/claims/components/heir-case"
import { getLocale } from "@/lib/i18n/server"

/**
 * ⚠️ **Never indexed.** The claim id *is* the capability — 32 random characters,
 * no second factor — so a crawler that reaches this page puts working keys to
 * strangers' bereavements into a search index. `publicStatus` is deliberately
 * readable without an account; that only stays safe while the URL stays private.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * One report.
 *
 * `params` is a promise in Next 16 — synchronous access was removed, not just
 * deprecated. The id goes through as a string: `claims.publicStatus` takes
 * `v.string()` and normalises it in the handler, because this id arrives from an
 * emailed link and mail clients truncate them. A validator rejection would be a
 * crash where "we could not find this report" is the honest answer.
 */
export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <>
      <HeirCase claimId={id} />
      <HelpLink locale={await getLocale()} topic="claim" claimId={id} />
    </>
  )
}
