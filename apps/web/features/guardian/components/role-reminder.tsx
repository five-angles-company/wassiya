"use client"


import { DocSection } from "@/components/doc/section"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { GUARDIAN } from "@/features/guardian/strings/guardian"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

/**
 * What a guardian is for, at the foot of the screen they land on years later. A
 * guardian may not open this app between accepting and the one day it matters,
 * so a person arriving after that gap read the invitation once, a long time ago.
 *
 * The two jobs are restated in the invitation's own words. **Reusing `GUARDIAN`
 * rather than paraphrasing into `GUARDIAN_DUTIES` is the point**: a guardian who
 * reads a different description of their role than the one they agreed to has
 * been told, quietly, that the terms moved.
 *
 * One mark, not three — the circles are the olive eyebrow rule the accept screen
 * already uses above its headings, which ties this block to the invitation it is
 * quoting. Titles sit at the row scale, because two short labels beside each
 * other are a pair to scan rather than two headings to read.
 */
export function RoleReminder() {
  const locale = useLocale()
  const invitation = t(GUARDIAN, locale)
  const labels = t(GUARDIAN_DUTIES, locale)

  const jobs = [
    { title: invitation.willConfirm, body: invitation.willConfirmBody },
    { title: invitation.willHandover, body: invitation.willHandoverBody },
  ]

  return (
    <DocSection title={labels.roleTitle}>
      <div className="grid gap-7 md:grid-cols-2 md:gap-10">
        {jobs.map((job) => (
          <div key={job.title}>
            <span
              aria-hidden
              className="bg-secondary block h-1 w-9 rounded-full"
            />
            <h3 className="font-heading mt-3.5 text-[15.5px] font-extrabold">
              {job.title}
            </h3>
            <p className="text-muted-foreground mt-2 text-[13.5px] leading-[1.7]">
              {job.body}
            </p>
          </div>
        ))}
      </div>

      {/* The note stays; the button that used to sit beside it is gone. It
          pointed at `/guardian/key`, which is now this same page — a control
          that redirects the reader back to where they already are. The key
          check itself is above, in `GuardianKey`. */}
      <p className="text-muted-foreground max-w-[66ch] text-[13px] leading-[1.7]">
        {labels.roleKeyNote}
      </p>
    </DocSection>
  )
}
