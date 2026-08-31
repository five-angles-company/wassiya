import { ButtonLink } from "@/components/button"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * A path that matches no page.
 *
 * The body points at the emailed link rather than at a search box, because the
 * likeliest visitor here is someone whose claim link was truncated by a mail
 * client — a real failure mode for a URL that is forwarded between relatives.
 */
export default async function NotFound() {
  const labels = t(COMMON, await getLocale())

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 md:px-8">
      <div className="border-border rounded-card border p-6">
        <h1 className="text-[22px] leading-[1.3]">
          {labels.routeMissingTitle}
        </h1>
        <p className="text-sand-700 mt-3 text-[15px] leading-[1.75]">
          {labels.routeMissingBody}
        </p>
        <ButtonLink href="/" variant="outline" className="mt-6">
          {labels.backHome}
        </ButtonLink>
      </div>
    </div>
  )
}
