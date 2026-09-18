"use client"

import Link from "next/link"

import { Prose } from "@/components/doc/prose"
import { RowLink, Rows } from "@/components/doc/rows"
import { DocTitle } from "@/components/doc/title"
import { useLocale } from "@/components/locale-provider"
import { shortRef } from "@/lib/claim-ref"
import { claimStatusLine } from "@/lib/claim-status-line"
import { fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { HOME } from "@/features/overview/strings/home"

type HeirCase = {
  id: string
  subjectName: string | null
  status: string
  submittedAt: number
}

type GuardianDuty = {
  claimId: string
  duty: "confirm" | "handover"
  subjectName: string | null
  heirLinked: boolean
}

/**
 * Everything in flight, in one list.
 *
 * **One list, not two sections.** A person who is both an heir and a guardian
 * has one set of obligations, not two jobs — and asking them to sort themselves
 * into a role before they can see what needs them is the dashboard thinking this
 * rework exists to remove. A guardian duty and a released box sit next to each
 * other because on any given morning they are the same kind of thing: something
 * waiting.
 *
 * Only reached when there is more than one. With exactly one, `/` goes straight
 * into it — a list of one is a menu with a single item.
 */
export function CaseList({
  cases,
  duties,
  name,
}: {
  cases: readonly HeirCase[]
  duties: readonly GuardianDuty[]
  name: string | null
}) {
  const locale = useLocale()
  const labels = t(HOME, locale)
  const common = t(COMMON, locale)

  return (
    <div className="flex flex-col gap-11">
      <DocTitle
        title={
          name === null
            ? labels.greetingAnonymous
            : labels.greeting.replace("{name}", name)
        }
      />

      <Prose>
        <p>{labels.listBody}</p>
      </Prose>

      <Rows>
        {duties.map((duty) => {
          // A confirm with no heir linked cannot be actioned — `guardianConfirm`
          // throws on it. It stays in the list rather than being filtered out: a
          // guardian who was emailed and then finds nothing here has been told
          // the app is broken.
          const blocked = duty.duty === "confirm" && !duty.heirLinked
          return (
            <RowLink
              key={`${duty.claimId}-${duty.duty}`}
              href={`/guardian/${duty.claimId}`}
              title={(duty.duty === "confirm"
                ? labels.dutyConfirm
                : labels.dutyHandover
              ).replace("{name}", duty.subjectName ?? "—")}
              status={
                blocked
                  ? labels.dutyBlockedBody
                  : duty.duty === "confirm"
                    ? labels.dutyConfirmBody
                    : labels.dutyHandoverBody
              }
              tone={blocked ? "quiet" : "attention"}
            />
          )
        })}

        {cases.map((row) => {
          const state = claimStatusLine(row.status, locale)
          return (
            <RowLink
              key={row.id}
              href={`/case/${row.id}`}
              title={labels.caseTitle.replace(
                "{name}",
                row.subjectName ?? labels.caseUnknownVault
              )}
              status={state.text}
              tone={state.tone}
              meta={`${common.filedOn} ${fmtDate(new Date(row.submittedAt), locale)} · ${shortRef(row.id)}`}
            />
          )
        })}
      </Rows>

      {/* Filing belongs to no report, so it has no step to live in. This is the
          screen where somebody looking at their own reports would reach for
          "another one", and it is the primary home for the action. */}
      <p>
        <Link
          href="/file"
          className="decoration-surface-accent text-[15px] font-semibold underline decoration-2 underline-offset-4"
        >
          {common.newReport}
        </Link>
      </p>
    </div>
  )
}
