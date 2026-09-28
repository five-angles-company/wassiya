"use client"

import { useState, type FormEvent } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { useMutation } from "convex/react"
import { CheckIcon } from "lucide-react"
import { toast } from "sonner"

import type { ClaimDetail } from "@/features/claims/lib/detail"
import { CLAIMS } from "@/features/claims/strings/claims"
import { fmtNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

/**
 * The ID-number row: a blind check of the certificate's number against the
 * owner's verified document. The server answers only yes or no; the typed
 * number is cleared as soon as it is sent, so it lingers nowhere on the page.
 */
export function ClaimIdCheck({
  detail,
  noNumber,
  onNoNumber,
  locale,
}: {
  detail: ClaimDetail
  /** The reviewer said the certificate carries no number. */
  noNumber: boolean
  onNoNumber: (none: boolean) => void
  locale: Locale
}) {
  const labels = t(CLAIMS, locale)
  const check = useMutation(api.claims.adminCheckIdNumber)
  const [value, setValue] = useState("")
  const [busy, setBusy] = useState(false)

  const { claim, subject } = detail
  const { attempts, max, matched } = claim.idCheck
  const left = max - attempts

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (value.trim().length === 0) return
    setBusy(true)
    try {
      await check({ claimId: claim.id as Id<"claims">, idNumber: value })
      setValue("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : labels.toastFailed)
    } finally {
      setBusy(false)
    }
  }

  if (!subject.hasIdNumbers) {
    return (
      <p className="text-sm text-foreground/80">{labels.idCheckNoNumbers}</p>
    )
  }
  if (matched === true) {
    return (
      <span className="flex h-10 items-center gap-2 self-start rounded-full bg-secondary/15 px-4 text-sm font-semibold text-secondary">
        <CheckIcon className="size-4" strokeWidth={3} />
        {labels.idCheckMatched}
      </span>
    )
  }
  if (left <= 0) {
    return (
      <p className="text-sm leading-relaxed text-destructive">
        {labels.idCheckExhausted.replace("{max}", fmtNumber(max, locale))}
      </p>
    )
  }
  if (noNumber) {
    return (
      <div className="flex flex-col items-start gap-1">
        <p className="text-sm text-foreground/80">{labels.idCheckNoneChosen}</p>
        <LinkButton onClick={() => onNoNumber(false)}>{labels.undo}</LinkButton>
      </div>
    )
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="flex flex-col items-start gap-2"
    >
      <div className="flex w-full gap-2">
        <Input
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={labels.idCheckPlaceholder}
          aria-label={labels.idLabel}
          disabled={busy}
          className="h-11 rounded-xl px-3.5 text-base tracking-wider md:text-base"
        />
        <Button
          type="submit"
          disabled={busy || value.trim().length === 0}
          className="h-11 rounded-xl bg-foreground px-5 font-semibold text-background hover:bg-foreground/90"
        >
          {labels.idCheckAction}
        </Button>
      </div>
      {matched === false && (
        <p className="text-sm font-semibold text-destructive">
          {labels.idCheckMismatch.replace("{n}", fmtNumber(left, locale))}
        </p>
      )}
      <LinkButton onClick={() => onNoNumber(true)}>
        {labels.idCheckNoNumber}
      </LinkButton>
    </form>
  )
}

function LinkButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="py-1 text-[13px] text-destructive underline underline-offset-4"
    >
      {children}
    </button>
  )
}
