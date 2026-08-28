import { cookies } from "next/headers"

import { JobsBoard } from "@/features/jobs/components/jobs-board"
import { JOBS } from "@/features/jobs/strings/jobs"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/** Thin, like every route here. */
export default async function Page() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(JOBS, locale)

  return (
    <>
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        {labels.pageTitle}
      </h1>
      <JobsBoard />
    </>
  )
}
