"use client"

import { cn } from "@workspace/ui/lib/utils"

import { fmtBirthDate } from "@/features/claims/lib/birth-date"
import type { ClaimDetail } from "@/features/claims/lib/detail"
import { CLAIMS } from "@/features/claims/strings/claims"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

/** How the certificate's ID number compared, as one line of the card. */
export type IdLine = { text: string; tone: "ok" | "bad" | "plain" }

/**
 * What the certificate is judged against: the owner's identity as Didit read
 * it off their document. Nothing here compares it with the certificate — that
 * is the reviewer's judgement, and the ID number is compared blind.
 */
export function ClaimIdentity({
  subject,
  idLine,
  locale,
}: {
  subject: ClaimDetail["subject"]
  idLine?: IdLine | null
  locale: Locale
}) {
  const labels = t(CLAIMS, locale)

  if (subject.verifiedName === null && subject.birthDate === null) {
    return (
      <p className="rounded-2xl bg-accent px-5 py-4 text-sm leading-relaxed font-semibold text-destructive">
        {labels.identityNone}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl bg-muted/70 p-5">
      <span className="text-xs text-muted-foreground">
        {labels.identityTitle}
        {subject.verifiedAt !== null &&
          " · " +
            labels.identityVerifiedOn.replace(
              "{date}",
              fmtDate(subject.verifiedAt, locale)
            )}
      </span>
      <span className="font-heading text-2xl leading-snug font-extrabold">
        <bdi>{subject.verifiedName ?? labels.none}</bdi>
      </span>
      <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-[15px]">
        <dt className="text-muted-foreground">{labels.birthDateLabel}</dt>
        <dd className="font-bold">
          {subject.birthDate === null
            ? labels.none
            : fmtBirthDate(subject.birthDate, locale)}
        </dd>
        <dt className="text-muted-foreground">{labels.docTypeLabel}</dt>
        <dd>
          <bdi>{subject.docType ?? labels.none}</bdi>
        </dd>
        {idLine != null && (
          <>
            <dt className="text-muted-foreground">{labels.idLabel}</dt>
            <dd
              className={cn(
                "font-semibold",
                idLine.tone === "ok" && "text-secondary",
                idLine.tone === "bad" && "text-destructive"
              )}
            >
              {idLine.text}
            </dd>
          </>
        )}
      </dl>
    </div>
  )
}
