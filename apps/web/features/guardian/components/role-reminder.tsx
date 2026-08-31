"use client"

import { ArrowRightIcon, CheckIcon, KeyRoundIcon } from "lucide-react"

import { ButtonLink } from "@/components/button"
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
 * ## The ink panel, and why this one is allowed to be dark
 *
 * It was a bare region and read as flat — nothing held the two jobs and the key
 * link together, so they looked like leftover paragraphs. It is the last block
 * on the page and it is the only one that is *about* the role rather than about
 * today, so it takes the ink surface the box's `HowItOpens` uses for the same
 * reason: a passage that explains rather than asks earns a different ground,
 * and one dark block at the foot of a sand page closes it.
 *
 * The key link is the only control, so it is a real button rather than a text
 * link — someone who came here because they were emailed about a handover
 * needs their sheet, and that is the whole reason this block carries a control
 * at all.
 */
export function RoleReminder() {
  const locale = useLocale()
  const invitation = t(GUARDIAN, locale)
  const labels = t(GUARDIAN_DUTIES, locale)

  return (
    <section className="rounded-sheet relative overflow-hidden bg-[#201e1d] p-6 text-[#f5ead8] shadow-[var(--shadow-raised)] md:p-8">
      <span
        aria-hidden
        className="bg-secondary/20 pointer-events-none absolute -bottom-24 -start-16 size-64 rounded-full blur-2xl"
      />

      <div className="relative">
        <h2 className="font-heading text-[18px] font-extrabold md:text-[20px]">
          {labels.roleTitle}
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-8">
          <Job
            title={invitation.willConfirm}
            body={invitation.willConfirmBody}
          />
          <Job
            title={invitation.willHandover}
            body={invitation.willHandoverBody}
          />
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-[color:rgba(245,234,216,.16)] pt-6">
          <p className="max-w-[52ch] flex-1 text-[13.5px] leading-[1.7] opacity-70">
            {labels.roleKeyNote}
          </p>
          <ButtonLink href="/guardian/key" variant="secondary">
            <KeyRoundIcon className="size-4" strokeWidth={2.3} aria-hidden />
            {labels.keyTitle}
            <ArrowRightIcon
              className="nudge size-4 rtl:-scale-x-100"
              strokeWidth={2.6}
              aria-hidden
            />
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

function Job({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-3.5">
      <span
        aria-hidden
        className="bg-secondary text-secondary-foreground mt-0.5 grid size-6 flex-none place-items-center rounded-full"
      >
        <CheckIcon className="size-3.5" strokeWidth={3} />
      </span>
      <div>
        <div className="text-[15px] font-semibold">{title}</div>
        <div className="mt-1.5 text-[13.5px] leading-[1.7] opacity-70">
          {body}
        </div>
      </div>
    </div>
  )
}
