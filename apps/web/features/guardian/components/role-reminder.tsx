"use client"

import { ArrowRightIcon, CheckIcon, KeyRoundIcon } from "lucide-react"

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
 * ## It is the same card as everything else
 *
 * It was briefly an ink panel, on the argument that a passage which explains
 * rather than asks earns its own ground. That argument is fine and the result
 * was not: a fourth surface colour on a page that already had three. Every card
 * in this app is `--card`, and what marks this one as different is that its
 * heading icon is olive and it sits last.
 */
export function RoleReminder() {
  const locale = useLocale()
  const invitation = t(GUARDIAN, locale)
  const labels = t(GUARDIAN_DUTIES, locale)

  return (
    <Panel accent="secondary" icon={CheckIcon} title={labels.roleTitle}>
      <div className="mt-1 grid gap-5 md:grid-cols-2 md:gap-8">
        <Job title={invitation.willConfirm} body={invitation.willConfirmBody} />
        <Job
          title={invitation.willHandover}
          body={invitation.willHandoverBody}
        />
      </div>

      <div className="border-border mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 border-t pt-5">
        <p className="text-muted-foreground max-w-[52ch] flex-1 text-[13.5px] leading-[1.7]">
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

function Job({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden
        className="bg-background text-secondary mt-0.5 grid size-6 flex-none place-items-center rounded-full"
      >
        <CheckIcon className="size-3.5" strokeWidth={3} />
      </span>
      <div>
        <div className="text-[14.5px] font-semibold">{title}</div>
        <div className="text-muted-foreground mt-1 text-[13.5px] leading-[1.65]">
          {body}
        </div>
      </div>
    </div>
  )
}
