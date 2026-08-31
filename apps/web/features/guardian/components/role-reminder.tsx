"use client"

import { ArrowRightIcon, KeyRoundIcon } from "lucide-react"

import { ButtonLink } from "@/components/button"
import { Panel } from "@/components/panel"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { GUARDIAN } from "@/features/guardian/strings/guardian"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

/**
 * What a guardian is for, at the foot of the screen they land on years later.
 *
 * ## Why it is not filler
 *
 * The product's own design says a guardian may not open this app between
 * accepting and the one day it matters — the accept screen sets that
 * expectation, and the duties list says "possibly years apart". A person
 * arriving after that gap read the invitation once, a long time ago, and the
 * screen otherwise tells them only that nothing needs them right now.
 *
 * The two jobs are restated in the invitation's own words. Reusing `GUARDIAN`
 * rather than paraphrasing into `GUARDIAN_DUTIES` is the point: a guardian who
 * reads a *different* description of their role than the one they agreed to has
 * been told, quietly, that the terms moved.
 *
 * ## What was messy, and what each fix was for
 *
 * Three ticks in one card — the heading carried a `CheckIcon` and each job
 * carried another in a circle — plus a divider, prose wrapping under a button,
 * and a circle size used nowhere else. Six kinds of thing in a box this small
 * is noise whatever the spacing.
 *
 * So: no heading icon, and the circles become the olive eyebrow rule the accept
 * screen already uses above *its* headings. That is one mark instead of three,
 * and it ties this block to the invitation it is quoting rather than inventing
 * a motif for it. Titles drop to the row scale, because two short labels beside
 * each other are a pair to scan, not two headings to read.
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
    <Panel title={labels.roleTitle}>
      <div className="mt-1 grid gap-7 md:grid-cols-2 md:gap-10">
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

      <div className="border-border mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-5">
        <p className="text-muted-foreground max-w-[46ch] flex-1 text-[13px] leading-[1.7]">
          {labels.roleKeyNote}
        </p>
        <ButtonLink href="/guardian/key" variant="outline" size="sm">
          <KeyRoundIcon className="size-4" strokeWidth={2.3} aria-hidden />
          {labels.keyTitle}
          <ArrowRightIcon
            className="nudge size-3.5 rtl:-scale-x-100"
            strokeWidth={2.6}
            aria-hidden
          />
        </ButtonLink>
      </div>
    </Panel>
  )
}
