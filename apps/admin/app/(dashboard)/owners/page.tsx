import { cookies } from "next/headers"

import { OwnersBrowser } from "@/features/owners/components/owners-browser"
import { OWNERS } from "@/features/owners/strings/owners"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/** The accounts list. Thin, like every route here. */
export default async function OwnersPage() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(OWNERS, locale)

  return (
    <>
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        {labels.pageTitle}
      </h1>
      <OwnersBrowser />
    </>
  )
}
