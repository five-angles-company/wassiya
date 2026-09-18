import { DocTitle } from "@/components/doc/title"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { FileClaimForm } from "@/features/claims/components/file-claim-form"
import { CLAIMS } from "@/features/claims/strings/claims"

/**
 * Filing a death report — and the app's one screen that a stranger can read.
 *
 * ## Why it is outside the sign-in wall
 *
 * This page's most useful part is the checklist: *"the commonest reason people
 * stall is starting without the death certificate."* That warning used to sit
 * **behind** the wall, so the flow was sign up → discover you need a document
 * you do not have → leave. Someone should be able to learn what a report
 * involves before being asked to make an account.
 *
 * The form still needs one — a report has to belong to a person, which is what
 * makes the rate limit and the 90-day lockout mean anything — so `FileClaimForm`
 * shows a sign-in card in place of the fields until there is a session. The
 * checklist renders either way.
 *
 * ## The header uses `DocTitle`, which grew an eyebrow for it
 *
 * ⚠️ **This page used to write its own header**, because it wants a line
 * **above** the title — how long this takes, and that it can be abandoned — and
 * `DocTitle` had no slot for one. The reason was good and the remedy was not: a
 * page that opts out of the title component is a page whose title stops tracking
 * every later change to it. The slot is on the component now.
 *
 * The condolence line in `newIntro` appears exactly once in the whole app.
 * Repeated sympathy stops reading as sympathy and starts reading as a script.
 */
export default async function FilePage() {
  const labels = t(CLAIMS, await getLocale())

  return (
    <div className="flex flex-col gap-11">
      <div className="flex flex-col gap-2.5">
        <DocTitle eyebrow={labels.timing} title={labels.newTitle} />
        <p className="text-muted-foreground max-w-[66ch] text-[15px] leading-[1.75]">
          {labels.newIntro}
        </p>
      </div>

      <FileClaimForm />
    </div>
  )
}
