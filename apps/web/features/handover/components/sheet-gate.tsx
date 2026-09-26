"use client"

import { useId, useState, type FormEvent, type KeyboardEvent } from "react"
import Link from "next/link"
import { ArrowRightIcon, CalendarClockIcon, FileKeyIcon, FileSearchIcon, MonitorSmartphoneIcon } from "lucide-react"

import { Button } from "@/components/button"
import { Ask } from "@/components/doc/ask"
import { DocTitle } from "@/components/doc/title"
import { IconDisc } from "@/components/icon-disc"
import { useLocale } from "@/components/locale-provider"
import { fmtDate } from "@/lib/format"
import { t, type Resolved } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import type { SheetsOnRecord, UnlockFailure } from "@/features/handover/lib/open-handover"
import { HANDOVER } from "@/features/handover/strings/handover"

/** The help article for an executor with no sheet — its slug is seeded in `convex/support/help.ts`. */
const LOST_SHEET_HELP = "/help#lost-executor-sheet"

/**
 * The step in front of the handover: one field for the sheet's code.
 *
 * ⚠️ The code is key material. It lives only in this component's state: the
 * field has no `name`, autocomplete is off, and it is handed to `onSubmit`,
 * which decodes it in this tab. Never put it in a URL, storage, a log, or a
 * request.
 *
 * A textarea rather than an input, so the whole code stays visible and can be
 * checked against the paper group by group.
 */
export function SheetGate({
  expiresAt,
  sheets,
  onSubmit,
}: {
  expiresAt: number
  sheets: SheetsOnRecord
  /** Why the code opened nothing, or `null` once it has opened. */
  onSubmit: (code: string) => UnlockFailure | null
}) {
  const locale = useLocale()
  const labels = t(HANDOVER, locale)
  const common = t(COMMON, locale)
  const fieldId = useId()
  const messageId = useId()
  const [code, setCode] = useState("")
  const [failure, setFailure] = useState<UnlockFailure | null>(null)

  const hint = sheets.executor
    ? sheets.recovery
      ? labels.codeHint
      : labels.codeHintExecutorOnly
    : labels.codeHintRecoveryOnly
  const canSubmit = code.trim().length > 0

  function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!canSubmit) return
    setFailure(onSubmit(code))
  }

  function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <article className="flex flex-col gap-6">
      <DocTitle
        eyebrow={labels.gateEyebrow}
        eyebrowIcon={FileKeyIcon}
        title={labels.gateTitle}
        lead={sheets.executor ? labels.gateBody : labels.gateBodyRecoveryOnly}
      />

      <div className="mt-4">
        <Ask
          eyebrow={common.askEyebrow}
          title={sheets.executor ? labels.askTitle : labels.askTitleRecoveryOnly}
          icon={FileKeyIcon}
        >
          <form onSubmit={submit} autoComplete="off" className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor={fieldId} className="text-[14px] font-semibold">
                {labels.codeLabel}
              </label>
              <textarea
                id={fieldId}
                value={code}
                onChange={(event) => {
                  setCode(event.target.value)
                  setFailure(null)
                }}
                onKeyDown={submitOnEnter}
                rows={3}
                dir="ltr"
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                data-1p-ignore
                data-lpignore="true"
                aria-invalid={failure !== null || undefined}
                aria-describedby={messageId}
                placeholder={sheets.executor ? "WSE1-XXXX-XXXX-…" : "WSY1-XXXX-XXXX-…"}
                className={`bg-background rounded-field placeholder:text-muted-foreground w-full resize-none border-[1.5px] px-4 py-3 font-mono text-[14.5px] leading-[1.8] font-semibold tracking-[.05em] uppercase transition-[border-color,box-shadow] outline-none focus-visible:border-[color:var(--primary)] focus-visible:ring-4 focus-visible:ring-[color:var(--ring)]/25 ${
                  failure === null ? "border-[color:var(--input)]" : "border-[color:var(--tone-attention)]"
                }`}
              />
              <span
                id={messageId}
                aria-live="polite"
                className={`text-[13px] leading-[1.6] ${failure === null ? "text-muted-foreground" : "text-tone-attention font-semibold"}`}
              >
                {failure === null ? hint : failureText(failure, labels)}
              </span>
            </div>

            <div className="flex flex-col items-start gap-3">
              <Button type="submit" size="lg" disabled={!canSubmit}>
                {labels.open}
                <ArrowRightIcon className="size-5 rtl:-scale-x-100" strokeWidth={2.75} aria-hidden />
              </Button>
              <span className="text-muted-foreground inline-flex items-center gap-2 text-[13.5px]">
                <MonitorSmartphoneIcon className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
                {labels.onDevice}
              </span>
            </div>
          </form>
        </Ask>
      </div>

      <section className="bg-card/60 border-border rounded-row flex items-start gap-4 border p-5">
        <IconDisc icon={FileSearchIcon} size="sm" />
        <div className="text-foreground/75 min-w-0 space-y-2 text-[14.5px] leading-[1.8]">
          <h2 className="font-heading text-foreground text-[16px] font-bold">
            {sheets.executor ? labels.lostTitle : labels.lostTitleRecovery}
          </h2>
          <p>{labels.lostLook}</p>
          {sheets.executor && sheets.recovery && <p>{labels.lostFallback}</p>}
          <p>{labels.lostNone}</p>
          <p>
            <Link href={LOST_SHEET_HELP} className="text-foreground font-semibold underline underline-offset-4">
              {labels.lostHelp}
            </Link>
          </p>
        </div>
      </section>

      <p className="bg-card/70 border-border text-foreground/75 rounded-row flex items-start gap-3 border p-4 text-[14px] leading-[1.75]">
        <CalendarClockIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" strokeWidth={2} aria-hidden />
        {labels.closesOn.replace("{date}", fmtDate(new Date(expiresAt), locale))}
      </p>
    </article>
  )
}

function failureText(failure: UnlockFailure, labels: Resolved<typeof HANDOVER>): string {
  switch (failure) {
    case "unreadable":
      return labels.failUnreadable
    case "executorReplaced":
      return labels.failExecutorReplaced
    case "recoveryReplaced":
      return labels.failRecoveryReplaced
    case "noExecutorSheet":
      return labels.failNoExecutorSheet
    case "noRecoverySheet":
      return labels.failNoRecoverySheet
    case "wrongSheet":
      return labels.failWrongSheet
  }
}
