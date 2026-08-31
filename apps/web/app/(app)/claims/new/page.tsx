import { ClockIcon } from "lucide-react"

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
 *
 * The header is written out here rather than borrowing `PageHeader`, because
 * this screen wants a third line: how long it takes, and that it can be
 * abandoned. That was a paragraph hanging below the block on a negative margin,
 * fighting the layout's own spacing — as an eyebrow above the title it answers
 * the question before the reader has committed to reading anything, which is
 * when they are actually asking it.
 */
export default async function NewClaimPage() {
  const labels = t(CLAIMS, await getLocale())

  return (
    <>
      <header className="flex flex-col gap-3">
        <p className="text-muted-foreground flex items-center gap-2 text-[13px] font-semibold">
          <ClockIcon className="size-4 shrink-0" strokeWidth={2.2} aria-hidden />
          {labels.timing}
        </p>
        <h1 className="font-heading text-[26px] leading-tight font-extrabold md:text-[30px]">
          {labels.newTitle}
        </h1>
        <p className="text-muted-foreground max-w-[58ch] text-[15px] leading-[1.75]">
          {labels.newIntro}
        </p>
      </header>

      <FileClaimForm />
    </>
  )
}
