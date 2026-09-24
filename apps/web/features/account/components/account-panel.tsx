"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"
import { BadgeCheckIcon, EyeOffIcon, LanguagesIcon, SmartphoneIcon, UserRoundIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { DocSection } from "@/components/doc/section"
import { useLocale } from "@/components/locale-provider"
import { Placeholder } from "@/components/placeholder"
import { fmtDate, fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { ACCOUNT } from "@/features/account/strings/account"

const STATUS_LABEL = {
  unverified: "identityUnverified",
  pending: "identityPending",
  verified: "identityVerified",
  rejected: "identityRejected",
} as const

export function AccountPanel() {
  const locale = useLocale()
  const labels = t(ACCOUNT, locale)
  const common = t(COMMON, locale)
  const me = useQuery(api.users.me, {})
  const identity = useQuery(api.identity.status, {})

  if (me === undefined) return <Placeholder label={common.loading} className="h-72" />

  const state = identity?.status ?? "unverified"
  const statusKey = STATUS_LABEL[state as keyof typeof STATUS_LABEL]
  const verified = state === "verified"

  return (
    <div className="flex flex-col gap-5">
      <DocSection title={labels.profileTitle} icon={UserRoundIcon}>
        <dl className="flex flex-col">
          <Row label={labels.name} value={me?.name ?? labels.notSet} first />
          <Row label={labels.email} value={me?.email ?? labels.notSet} ltr />
        </dl>
      </DocSection>

      <DocSection title={labels.identityTitle} icon={BadgeCheckIcon} description={labels.identityWhy}>
        <p
          className={cn(
            "inline-flex w-fit rounded-full px-4 py-1.5 text-[14.5px] font-bold",
            verified ? "bg-tone-settled-soft text-tone-settled" : "bg-muted text-foreground"
          )}
        >
          {statusKey === undefined ? state : labels[statusKey]}
        </p>
        <dl className="flex flex-col">
          {identity?.verifiedName != null && (
            <Row label={labels.identityVerifiedName} value={identity.verifiedName} first />
          )}
          {identity?.verifiedAt != null && (
            <Row
              label={labels.identityVerifiedAt}
              value={fmtDate(new Date(identity.verifiedAt), locale)}
              first={identity.verifiedName == null}
            />
          )}
        </dl>
        {identity != null && !verified && (
          <p className="text-muted-foreground text-[14px]">
            {labels.identityAttempts.replace("{n}", fmtNumber(identity.attemptsRemaining, locale))}
          </p>
        )}
      </DocSection>

      <DocSection title={labels.seeTitle} icon={EyeOffIcon}>
        <p className="text-foreground/75 max-w-[62ch] text-[15.5px] leading-[1.85]">{labels.seeBody}</p>
      </DocSection>

      <div className="grid gap-5 md:grid-cols-2">
        <DocSection title={labels.languageTitle} icon={LanguagesIcon} description={labels.languageBody} />
        <DocSection title={labels.ownerTitle} icon={SmartphoneIcon} description={labels.ownerBody} />
      </div>
    </div>
  )
}

function Row({ label, value, ltr = false, first = false }: { label: string; value: string; ltr?: boolean; first?: boolean }) {
  return (
    <div className={cn("flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3", !first && "border-border border-t")}>
      <dt className="text-muted-foreground text-[14px]">{label}</dt>
      {/* An email is a Latin machine string: isolated, or the bidi algorithm
          reorders it inside the Arabic column. */}
      <dd className={cn("text-[15px] font-semibold", ltr && "ltr-isolate")}>{value}</dd>
    </div>
  )
}
