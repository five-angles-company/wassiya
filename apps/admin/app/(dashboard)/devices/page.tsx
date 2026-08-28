import { cookies } from "next/headers"

import { DevicesBrowser } from "@/features/devices/components/devices-browser"
import { DEVICES } from "@/features/devices/strings/devices"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/** Thin, like every route here. */
export default async function Page() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(DEVICES, locale)

  return (
    <>
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        {labels.pageTitle}
      </h1>
      <DevicesBrowser />
    </>
  )
}
