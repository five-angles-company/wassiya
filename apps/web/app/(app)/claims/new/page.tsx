import { PageHeader } from "@/components/page-header"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { FileClaimForm } from "@/features/claims/components/file-claim-form"
import { CLAIMS } from "@/features/claims/strings/claims"

/**
 * Filing a death report.
 *
 * The condolence line lives in `newIntro` and appears exactly once in the whole
 * app — repeated sympathy stops reading as sympathy and starts reading as a
 * script.
 */
export default async function NewClaimPage() {
  const labels = t(CLAIMS, await getLocale())

  return (
    <>
      <PageHeader title={labels.newTitle} description={labels.newIntro} />
      <p className="text-muted-foreground -mt-3 text-[13px]">{labels.timing}</p>
      <FileClaimForm />
    </>
  )
}
