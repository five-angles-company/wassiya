"use client"

import { ArrowRightIcon, CheckIcon, KeyRoundIcon } from "lucide-react"

import { ButtonLink } from "@/components/button"
import { Section } from "@/components/section"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { GUARDIAN } from "@/features/guardian/strings/guardian"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

/**
 * What a guardian is for, on the screen they land on years later.
 *
 * ## Why this is not filler
 *
 * The whole product design says a guardian may not open this app between
 * accepting and the one day it matters — the accept screen sets that
 * expectation explicitly, and the duties list says "possibly years apart". A
 * person arriving after that gap has read the invitation once, a long time ago,
 * and the screen otherwise tells them only that nothing needs them right now.
 *
 * So the two jobs are restated here, in the same words the invitation used.
 * Reusing `GUARDIAN` rather than paraphrasing into `GUARDIAN_DUTIES` is the
 * point: a guardian who reads a *different* description of their role than the
 * one they agreed to has been told, quietly, that the terms moved.
 *
 * ## And it carries the way to the key page
 *
 * The guardian's two screens are this one and their key, and the key was
 * reachable only from the bar. Someone who opens the app because they were
 * emailed about a handover needs their sheet, and the link belongs next to the
 * sentence that says they will be asked for it.
 *
 * ## A section, not a panel
 *
 * It is context, not an object — nothing here can be acted on except the link,
 * and a border around a reminder is a border that has stopped meaning anything.
 * It sits last for the same reason.
 */
export function RoleReminder() {
  const locale = useLocale()
  const invitation = t(GUARDIAN, locale)
  const labels = t(GUARDIAN_DUTIES, locale)

  return (
    <Section
      title={labels.roleTitle}
      action={
        <ButtonLink href="/guardian/key" variant="ghost" size="sm">
          <KeyRoundIcon className="size-4" strokeWidth={2.3} aria-hidden />
          {labels.keyTitle}
          <ArrowRightIcon
            className="nudge size-3.5 rtl:-scale-x-100"
            strokeWidth={2.6}
            aria-hidden
          />
        </ButtonLink>
      }
    >
      <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
        <Job title={invitation.willConfirm} body={invitation.willConfirmBody} />
        <Job
          title={invitation.willHandover}
          body={invitation.willHandoverBody}
        />
      </div>

      <p className="text-muted-foreground mt-1 max-w-[62ch] text-[13px] leading-[1.7]">
        {labels.roleKeyNote}
      </p>
    </Section>
  )
}

function Job({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden
        className="bg-secondary text-secondary-foreground mt-0.5 grid size-5 flex-none place-items-center rounded-full"
      >
        <CheckIcon className="size-3" strokeWidth={3} />
      </span>
      <div>
        <div className="text-[14px] font-semibold">{title}</div>
        <div className="text-muted-foreground mt-1 text-[13px] leading-[1.65]">
          {body}
        </div>
      </div>
    </div>
  )
}
