import Link from "next/link"
import { cookies } from "next/headers"
import { Button } from "@workspace/ui/components/button"
import { MapPinOffIcon } from "lucide-react"

import { LOCALE_COOKIE, resolveLocale, t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * A path that matches no route at all.
 *
 * At the root rather than inside `(dashboard)`, because an unmatched address
 * never reaches a segment: Next resolves it against the root, so a `not-found`
 * in the group would only ever fire for an explicit `notFound()` call, and this
 * console makes none. It renders in the root layout, which is what keeps the
 * direction and the Arabic faces right.
 *
 * Distinct from `RecordNotFound`, which is a route that *does* exist holding an
 * id that names nothing. This one is the address itself being wrong, so there
 * is no list to go back to — only the dashboard.
 */
export default async function NotFound() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const labels = t(COMMON, locale)

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col items-start gap-4 rounded-xl border bg-card p-6 text-card-foreground">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <MapPinOffIcon className="size-5" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-lg font-semibold">
            {labels.routeMissingTitle}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {labels.routeMissingBody}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">{labels.backToDashboard}</Link>
        </Button>
      </div>
    </div>
  )
}
