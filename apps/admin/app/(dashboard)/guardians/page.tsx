import { cookies } from "next/headers"

import { GuardiansBrowser } from "@/features/guardians/components/guardians-browser"
import { GUARDIANS } from "@/features/guardians/strings/guardians"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/** The guardians list. Thin, like every route here. */
export default async function GuardiansPage() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(GUARDIANS, locale)

  return (
    <>
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        {labels.pageTitle}
      </h1>
      <GuardiansBrowser />
    </>
  )
}
