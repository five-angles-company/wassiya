import { cookies } from "next/headers"

import { FillScreen } from "@/components/fill-screen"
import { SubscriptionsBrowser } from "@/features/subscriptions/components/subscriptions-browser"
import { SUBSCRIPTIONS } from "@/features/subscriptions/strings/subscriptions"
import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"

/** Thin, like every route here. */
export default async function Page() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(SUBSCRIPTIONS, locale)

  return (
    <FillScreen>
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        {labels.pageTitle}
      </h1>
      <p className="-mt-4 max-w-2xl text-sm text-muted-foreground">
        {labels.intro}
      </p>
      <SubscriptionsBrowser />
    </FillScreen>
  )
}
