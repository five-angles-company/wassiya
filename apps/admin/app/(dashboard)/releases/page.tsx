import { cookies } from "next/headers"

import { ReleasesPipeline } from "@/features/releases/components/releases-pipeline"
import { RELEASES } from "@/features/releases/strings/releases"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/** Thin, like every route here. */
export default async function Page() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(RELEASES, locale)

  return (
    <>
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        {labels.pageTitle}
      </h1>
      <ReleasesPipeline />
    </>
  )
}
