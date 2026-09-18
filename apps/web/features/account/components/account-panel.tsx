"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"

import { DocSection } from "@/components/doc/section"
import { useLocale } from "@/components/locale-provider"
import { fmtDate, fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { ACCOUNT } from "@/features/account/strings/account"

const STATUS_LABEL = {
  unverified: "identityUnverified",
  pending: "identityPending",
  verified: "identityVerified",
  rejected: "identityRejected",
} as const

/**
 * What this service knows about you, and what it does not.
 *
 * Short on purpose. Almost nothing here is editable — the profile is synced
 * from Clerk, the identity verdict comes from Didit, and the vault is on
 * another device entirely. The screen exists because a product that asks
 * someone for a passport photo in the week of a funeral owes them a page that
 * answers *"what do you have of mine?"* without making them read a policy.
 *
 * `weCannotBody` is the one paragraph that is not administrative. It is the
 * encryption promise, stated where someone anxious will go looking for it.
 */
export function AccountPanel() {
  const locale = useLocale()
  const labels = t(ACCOUNT, locale)
  const me = useQuery(api.users.me, {})
  const identity = useQuery(api.identity.status, {})

  if (me === undefined) {
    return (
      <div className="border-border h-40 animate-pulse border-y" aria-hidden />
    )
  }

  const state = identity?.status ?? "unverified"
  const statusKey = STATUS_LABEL[state as keyof typeof STATUS_LABEL]

  return (
    <div className="flex flex-col gap-6">
      <DocSection title={labels.profileTitle}>
        <dl className="flex flex-col">
          <Row label={labels.name} value={me?.name ?? labels.notSet} first />
          <Row label={labels.email} value={me?.email ?? labels.notSet} ltr />
        </dl>
      </DocSection>

      <DocSection title={labels.identityTitle}>
        <p className="text-[15px] font-semibold">
          {statusKey === undefined ? state : labels[statusKey]}
        </p>

        {identity?.verifiedName != null && (
          <p className="mt-2 text-[14px]">
            <span className="opacity-60">{labels.identityVerifiedName}: </span>
            {identity.verifiedName}
          </p>
        )}
        {identity?.verifiedAt != null && (
          <p className="mt-1 text-[14px]">
            <span className="opacity-60">{labels.identityVerifiedAt}: </span>
            {fmtDate(new Date(identity.verifiedAt), locale)}
          </p>
        )}
        {identity != null && state !== "verified" && (
          <p className="mt-2 text-[13.5px] opacity-70">
            {labels.identityAttempts.replace(
              "{n}",
              fmtNumber(identity.attemptsRemaining, locale)
            )}
          </p>
        )}

        <p
          className={`mt-4 text-[13.5px] leading-[1.7] ${
            state === "verified" ? "opacity-80" : "text-muted-foreground"
          }`}
        >
          {labels.identityWhy}
        </p>
      </DocSection>

      <DocSection title={labels.weCannotTitle}>
        <p className="text-muted-foreground max-w-[66ch] text-[14.5px] leading-[1.75]">
          {labels.weCannotBody}
        </p>
      </DocSection>

      <div className="grid gap-6 md:grid-cols-2">
        <DocSection title={labels.languageTitle}>
          <p className="text-muted-foreground text-[14px] leading-[1.7]">
            {labels.languageBody}
          </p>
        </DocSection>
        <DocSection title={labels.ownerTitle}>
          <p className="text-muted-foreground text-[14px] leading-[1.7]">
            {labels.ownerBody}
          </p>
        </DocSection>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  ltr = false,
  first = false,
}: {
  label: string
  value: string
  ltr?: boolean
  first?: boolean
}) {
  return (
    <div
      className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 ${
        first ? "" : "border-border border-t"
      }`}
    >
      <dt className="text-[13.5px] opacity-60">{label}</dt>
      {/* An email is a Latin machine string: isolated, or the bidi algorithm
          reorders it inside the Arabic column and it can no longer be read. */}
      <dd className={`text-[14.5px] font-semibold ${ltr ? "ltr-isolate" : ""}`}>
        {value}
      </dd>
    </div>
  )
}
