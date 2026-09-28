"use client"

import { useState, type ReactNode } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { useMutation } from "convex/react"
import { toast } from "sonner"

import { ClaimIdCheck } from "@/features/claims/components/claim-id-check"
import { ClaimMore } from "@/features/claims/components/claim-more"
import { fmtBirthDate } from "@/features/claims/lib/birth-date"
import type { ClaimDetail } from "@/features/claims/lib/detail"
import {
  REJECT_REASONS,
  rejectReasonLabel,
  type RejectReason,
} from "@/features/claims/lib/status"
import { CLAIMS } from "@/features/claims/strings/claims"
import { fmtDate, fmtNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

type Answer = boolean | null
type Mode = "review" | "approve" | "reject"

/**
 * The review of a submitted report as a comparison: each fact on the owner's
 * verified identity against the certificate, marked matching or not, and the
 * ID number compared blind. Approve waits for every row; a "doesn't match"
 * pre-selects the rejection's reason.
 *
 * The marks are component state and pace the reviewer; the server records
 * only the ID checks and the ruling. A successful ruling moves the report out
 * of `submitted`, and the panel swaps this for the ruling.
 */
export function ClaimCompare({
  detail,
  locale,
}: {
  detail: ClaimDetail
  locale: Locale
}) {
  const labels = t(CLAIMS, locale)
  const setNameMatch = useMutation(api.claims.adminSetNameMatch)
  const [name, setName] = useState<Answer>(null)
  const [birth, setBirth] = useState<Answer>(null)
  const [noNumber, setNoNumber] = useState(false)
  const [mode, setMode] = useState<Mode>("review")
  const [reason, setReason] = useState<RejectReason | null>(null)
  const [busy, setBusy] = useState(false)

  const { claim, subject } = detail
  const { attempts, max, matched } = claim.idCheck
  const hasName = subject.verifiedName !== null
  const hasBirth = subject.birthDate !== null
  const hasIdentity = hasName || hasBirth
  const idDone =
    !subject.hasIdNumbers || matched === true || attempts >= max || noNumber
  const open = [
    hasName && name === null,
    hasBirth && birth === null,
    !idDone,
  ].filter(Boolean).length
  const mismatch = name === false || birth === false
  const hasCertificate = claim.certificateUrl !== null
  const complete = hasIdentity && hasCertificate && open === 0 && !mismatch

  const summary = mismatch
    ? { text: labels.summaryMismatch, tone: "text-destructive" }
    : !hasCertificate
      ? { text: labels.sitNoCertificate, tone: "text-muted-foreground" }
      : complete
        ? { text: labels.summaryAllMatch, tone: "text-secondary" }
        : {
            text: labels.summaryLeft
              .replace("{n}", fmtNumber(open, locale))
              .replace("{total}", fmtNumber(3, locale)),
            tone: "text-muted-foreground",
          }

  async function rule(nameMatch: boolean) {
    setBusy(true)
    try {
      await setNameMatch({
        claimId: claim.id as Id<"claims">,
        nameMatch,
        rejectReason: nameMatch ? undefined : (reason ?? undefined),
      })
      toast.success(nameMatch ? labels.toastApproved : labels.toastRejected)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : labels.toastFailed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-7 pt-6 pb-2">
        <h2 className="font-heading text-[21px] font-extrabold">
          {labels.compareTitle}
        </h2>
        {subject.verifiedAt !== null && (
          <p className="mt-1 text-[13px] text-muted-foreground">
            {labels.compareVerifiedOn.replace(
              "{date}",
              fmtDate(subject.verifiedAt, locale)
            )}
          </p>
        )}

        {!hasIdentity ? (
          <p className="mt-5 rounded-2xl bg-accent p-4 text-sm leading-relaxed font-semibold text-destructive">
            {labels.identityNone}
          </p>
        ) : (
          <div className="mt-2 flex flex-col divide-y">
            <Row
              label={labels.nameLabel}
              answer={hasName ? name : undefined}
              onAnswer={setName}
              labels={labels}
            >
              <bdi>{subject.verifiedName ?? labels.notOnFile}</bdi>
            </Row>
            <Row
              label={labels.birthDateLabel}
              answer={hasBirth ? birth : undefined}
              onAnswer={setBirth}
              labels={labels}
            >
              {subject.birthDate === null
                ? labels.notOnFile
                : fmtBirthDate(subject.birthDate, locale)}
            </Row>
            <div className="flex flex-col gap-2.5 py-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] text-muted-foreground">
                  {labels.idLabel}
                </span>
                <span className="text-[13px] text-muted-foreground">
                  {labels.idRowHint}
                </span>
              </div>
              <ClaimIdCheck
                detail={detail}
                noNumber={noNumber}
                onNoNumber={setNoNumber}
                locale={locale}
              />
            </div>
            <ClaimMore detail={detail} locale={locale} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3.5 border-t px-7 pt-4 pb-6">
        {mode === "review" && (
          <>
            <p className={cn("text-sm font-semibold", summary.tone)}>
              {summary.text}
            </p>
            <div className="flex gap-2.5">
              <Action
                tone="danger"
                disabled={!hasCertificate}
                onClick={() => {
                  setReason(reason ?? (mismatch ? "names_differ" : null))
                  setMode("reject")
                }}
              >
                {labels.reject}
              </Action>
              <Action
                tone="primary"
                grow
                disabled={!complete}
                onClick={() => setMode("approve")}
              >
                {labels.approve}
              </Action>
            </div>
          </>
        )}

        {mode === "approve" && (
          <>
            <p className="text-[15px] leading-relaxed">{labels.approveBody}</p>
            <div className="flex gap-2.5">
              <Action
                tone="quiet"
                disabled={busy}
                onClick={() => setMode("review")}
              >
                {labels.cancel}
              </Action>
              <Action
                tone="primary"
                grow
                disabled={busy}
                onClick={() => void rule(true)}
              >
                {labels.approveConfirm}
              </Action>
            </div>
          </>
        )}

        {mode === "reject" && (
          <>
            <p className="text-[15px] leading-relaxed font-bold">
              {labels.rejectQuestion}
            </p>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {REJECT_REASONS.map((option) => (
                <Pill
                  key={option}
                  selected={reason === option}
                  tone="no"
                  onClick={() => setReason(option)}
                  role="radio"
                >
                  {rejectReasonLabel(option, locale)}
                </Pill>
              ))}
            </div>
            <div className="flex gap-2.5">
              <Action
                tone="quiet"
                disabled={busy}
                onClick={() => setMode("review")}
              >
                {labels.cancel}
              </Action>
              <Action
                tone="dangerFill"
                grow
                disabled={busy || reason === null}
                onClick={() => void rule(false)}
              >
                {labels.rejectConfirm}
              </Action>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** One fact from the owner's verified identity, and the reviewer's mark on it. */
function Row({
  label,
  answer,
  onAnswer,
  labels,
  children,
}: {
  label: string
  /** `undefined`: nothing on file to compare. */
  answer: Answer | undefined
  onAnswer: (value: boolean) => void
  labels: ReturnType<typeof t<typeof CLAIMS>>
  children: ReactNode
}) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <span
          className={cn(
            "font-heading text-[19px] leading-snug font-bold",
            answer === undefined && "text-muted-foreground"
          )}
        >
          {children}
        </span>
      </div>
      {answer !== undefined && (
        <div className="flex shrink-0 gap-1.5">
          <Pill
            selected={answer === true}
            tone="yes"
            onClick={() => onAnswer(true)}
          >
            {labels.matches}
          </Pill>
          <Pill
            selected={answer === false}
            tone="no"
            onClick={() => onAnswer(false)}
          >
            {labels.noMatch}
          </Pill>
        </div>
      )}
    </div>
  )
}

function Pill({
  selected,
  tone,
  onClick,
  role,
  children,
}: {
  selected: boolean
  tone: "yes" | "no"
  onClick: () => void
  role?: "radio"
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role={role}
      aria-pressed={role === undefined ? selected : undefined}
      aria-checked={role === "radio" ? selected : undefined}
      className={cn(
        "h-11 rounded-full border-[1.5px] px-4 text-sm font-semibold transition-colors",
        !selected && "border-foreground/25 hover:bg-muted",
        selected &&
          tone === "yes" &&
          "border-secondary bg-secondary/15 text-secondary",
        selected &&
          tone === "no" &&
          "border-destructive bg-accent text-destructive"
      )}
    >
      {children}
    </button>
  )
}

const TONES = {
  primary:
    "bg-primary text-lg text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground",
  quiet: "border-[1.5px] border-foreground/25 px-6 hover:bg-muted",
  danger:
    "border-[1.5px] border-destructive px-6 text-destructive hover:bg-destructive/10 hover:text-destructive",
  dangerFill:
    "bg-destructive text-primary-foreground hover:bg-destructive/90 disabled:bg-muted disabled:text-muted-foreground",
} as const

function Action({
  tone,
  grow,
  disabled,
  onClick,
  children,
}: {
  tone: keyof typeof TONES
  grow?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-[52px] rounded-2xl text-base font-bold disabled:opacity-100",
        grow && "flex-1",
        TONES[tone]
      )}
    >
      {children}
    </Button>
  )
}
