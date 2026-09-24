"use client"

import { RotateCcwIcon } from "lucide-react"

import { Button } from "@/components/button"
import { useLocale } from "@/components/locale-provider"
import { NoticeCard } from "@/components/notice-card"
import { PageColumn } from "@/components/page-column"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * The error boundary's face. It renders inside the site shell, so the header
 * and the way home survive the error.
 *
 * ⚠️ The error's message is never shown — it can carry internals. Only the
 * digest, which support can look up.
 */
export function ErrorPanel({
  error,
  reset,
  inColumn = true,
}: {
  error: Error & { digest?: string }
  reset: () => void
  /** False where a group layout already provides the column. */
  inColumn?: boolean
}) {
  const labels = t(COMMON, useLocale())

  const card = (
    <NoticeCard
      icon={RotateCcwIcon}
      tone="attention"
      title={labels.errorTitle}
      body={labels.errorBody}
      headingLevel="h1"
      action={
        <Button variant="outline" onClick={reset}>
          {labels.retry}
        </Button>
      }
    >
      {error.digest !== undefined && (
        <p className="text-muted-foreground ltr-isolate font-mono text-[12px]">
          {labels.errorDigest}: {error.digest}
        </p>
      )}
    </NoticeCard>
  )

  return inColumn ? <PageColumn>{card}</PageColumn> : card
}
