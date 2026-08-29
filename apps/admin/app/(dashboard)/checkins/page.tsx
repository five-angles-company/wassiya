import { cookies } from "next/headers"

import { FillScreen } from "@/components/fill-screen"
import { CheckinsBrowser } from "@/features/checkins/components/checkins-browser"
import { CHECKINS } from "@/features/checkins/strings/checkins"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/** Thin, like every route here. */
export default async function Page() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(CHECKINS, locale)

  return (
    <FillScreen>
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        {labels.pageTitle}
      </h1>
      <CheckinsBrowser />
    </FillScreen>
  )
}
