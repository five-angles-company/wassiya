"use client"

import { SearchXIcon } from "lucide-react"

import { ButtonLink } from "@/components/button"
import { useLocale } from "@/components/locale-provider"
import { NoticeCard } from "@/components/notice-card"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * A detail page whose record is not there — a mistyped URL, an old bookmark, a
 * link a mail client cut short. It renders inside the shell rather than
 * replacing it, so the way back is still on screen.
 */
export function RecordNotFound({ id, backHref, backLabel }: { id: string; backHref: string; backLabel: string }) {
  const labels = t(COMMON, useLocale())

  return (
    <NoticeCard
      icon={SearchXIcon}
      title={labels.notFoundTitle}
      body={labels.notFoundBody}
      headingLevel="h1"
      action={
        <ButtonLink href={backHref} variant="outline">
          {backLabel}
        </ButtonLink>
      }
    >
      <p dir="ltr" className="text-muted-foreground font-mono text-[12px]">
        {id}
      </p>
    </NoticeCard>
  )
}
