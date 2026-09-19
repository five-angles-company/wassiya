"use client"

import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/button"
import { Prose } from "@/components/doc/prose"
import { SetApart } from "@/components/doc/set-apart"
import { DocTitle } from "@/components/doc/title"
import { useLocale } from "@/components/locale-provider"
import { fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { HEIR_BOX } from "@/features/box/strings/heir-box"

/**
 * The last screen before the contents: one action, and the date after which
 * the delivery can never be opened again — stated here because a reader who
 * learns it later has already lost what they did not download.
 */
export function BoxGate({
  expiresAt,
  busy,
  error,
  onUnlock,
}: {
  expiresAt: number
  busy: boolean
  error?: string
  onUnlock: () => void
}) {
  const locale = useLocale()
  const labels = t(HEIR_BOX, locale)

  return (
    <article className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <DocTitle title={labels.gateTitle} />
        <Prose>
          <p>{labels.gateBody}</p>
        </Prose>
      </div>

      <SetApart className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-5">
          <Button size="lg" onClick={onUnlock} disabled={busy}>
            {busy ? labels.unlocking : labels.unlock}
            <ArrowRightIcon
              className="size-5 rtl:-scale-x-100"
              strokeWidth={2.75}
              aria-hidden
            />
          </Button>
          <span className="text-muted-foreground max-w-[240px] text-[13.5px] leading-[1.55]">
            {labels.onDevice}
          </span>
        </div>
        {error !== undefined && (
          <p className="text-tone-attention max-w-[66ch] text-[14px] leading-[1.65]">
            {error}
          </p>
        )}
        <p className="text-muted-foreground max-w-[66ch] text-[13.5px] leading-[1.7]">
          {labels.closesOn.replace("{date}", fmtDate(new Date(expiresAt), locale))}
        </p>
      </SetApart>
    </article>
  )
}
