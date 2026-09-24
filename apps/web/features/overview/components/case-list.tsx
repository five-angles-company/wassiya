"use client"

import Link from "next/link"
import { HeartHandshakeIcon, MailOpenIcon, PlusIcon } from "lucide-react"

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

/** More than one thing in flight: deliveries first, then reports. */
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

  // `awaiting_heir` still needs the heir's identity check; only
  // `identity_pending` is ours to finish.
  const deliveryStatus = (row: DeliveryRow) =>
    row.status === "rejected" || row.status === "expired"
      ? { text: labels.deliveryClosed, tone: "quiet" as const }
      : row.status === "ready"
        ? { text: labels.deliveryReady, tone: "settled" as const }
        : row.status === "awaiting_heir"
          ? { text: labels.deliveryIdentity, tone: "attention" as const }
          : { text: labels.deliveryChecking, tone: "settled" as const }

  return (
    <div className="flex flex-col gap-8">
      <DocTitle
        title={name === null ? labels.greetingAnonymous : labels.greeting.replace("{name}", name)}
        lead={labels.listBody}
      />

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-[20px] font-extrabold">{labels.listTitle}</h2>
        <Rows>
          {deliveries.map((row) => {
            const state = deliveryStatus(row)
            return (
              <RowLink
                key={row.deliveryId}
                href={`/delivery/${row.deliveryId}`}
                icon={MailOpenIcon}
                title={
                  row.subjectName === null
                    ? labels.deliveryUnknown
                    : labels.deliveryTitle.replace("{name}", row.subjectName)
                }
                status={state.text}
                tone={state.tone}
              />
            )
          })}

          {cases.map((row) => {
            const state = claimStatusLine(row.status, locale)
            return (
              <RowLink
                key={row.id}
                href={`/case/${row.id}`}
                icon={HeartHandshakeIcon}
                title={labels.caseTitle.replace("{name}", row.subjectName ?? labels.caseUnknownVault)}
                status={state.text}
                tone={state.tone}
                meta={`${common.filedOn} ${fmtDate(new Date(row.submittedAt), locale)} · ${shortRef(row.id)}`}
              />
            )
          })}
        </Rows>
      </section>

      {/* Filing belongs to no report, so it has no step to live in; this is
          where someone looking at their reports reaches for another one. */}
      <div>
        <Link
          href="/file"
          className="border-border bg-card/60 hover:bg-card inline-flex h-11 items-center gap-2 rounded-full border px-5 text-[14.5px] font-semibold transition-colors"
        >
          <PlusIcon className="size-4" strokeWidth={2.5} aria-hidden />
          {common.newReport}
        </Link>
      </div>
    </div>
  )
}
