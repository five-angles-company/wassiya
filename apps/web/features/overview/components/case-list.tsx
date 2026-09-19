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

type ReportRow = {
  id: string
  subjectName: string | null
  status: string
  submittedAt: number
}

type DeliveryRow = {
  deliveryId: string
  status: "awaiting_heir" | "identity_pending" | "ready" | "rejected" | "expired"
  subjectName: string | null
  expiresAt: number
}

/**
 * Everything in flight, in one list: reports this person filed and deliveries
 * waiting for them. One list rather than two sections — a person who is both
 * has one set of things waiting, not two roles to sort themselves into.
 *
 * Only reached when there is more than one. With exactly one, `/` goes
 * straight into it.
 */
export function CaseList({
  cases,
  deliveries,
  name,
}: {
  cases: readonly ReportRow[]
  deliveries: readonly DeliveryRow[]
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
        {deliveries.map((row) => {
          const closed = row.status === "rejected" || row.status === "expired"
          return (
            <RowLink
              key={row.deliveryId}
              href={`/delivery/${row.deliveryId}`}
              title={
                row.subjectName === null
                  ? labels.deliveryUnknown
                  : labels.deliveryTitle.replace("{name}", row.subjectName)
              }
              status={
                closed
                  ? labels.deliveryClosed
                  : row.status === "ready"
                    ? labels.deliveryReady
                    : labels.deliveryChecking
              }
              tone={closed ? "quiet" : row.status === "ready" ? "settled" : "attention"}
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
          "another one". */}
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
