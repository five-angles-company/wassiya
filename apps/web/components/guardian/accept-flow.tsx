"use client"

import { useState } from "react"
import Link from "next/link"
import { Authenticated, Unauthenticated, useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import {
  guardianKeyMatches,
  mintGuardianKeySheet,
  type GuardianKeySheet,
} from "@workspace/crypto/guardianKey"
import { ArrowRightIcon, CheckIcon, PrinterIcon, XIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { t, type Resolved } from "@/lib/i18n/locale"
import { GUARDIAN } from "@/lib/i18n/strings/guardian"

type Phase =
  | { step: "review" }
  | { step: "sheet"; sheet: GuardianKeySheet }
  | { step: "confirm"; sheet: GuardianKeySheet; error?: "mismatch" | "failed" }
  | { step: "done" }

/**
 * `/guardian/accept` — the invitation, the key, and the one confirmation.
 *
 * ## The ordering is load-bearing: mint → display → confirm → accept
 *
 * `guardians.accept` publishes the guardian's X25519 public key and spends the
 * invitation. If it ran before the guardian had seen and typed back their code,
 * a public key would exist whose private half nobody holds — and nothing would
 * notice: the owner's protection score would turn green, every heir bundle
 * would seal to that key, and the failure would surface years later at the one
 * ceremony that cannot be retried.
 *
 * So the key is minted here in the browser, shown, and only accepted once
 * `guardianKeyMatches` confirms the guardian can reproduce it. The invitation
 * survives an abandoned attempt; a key nobody holds would not survive anything.
 *
 * ## Nothing leaves this component but a public key
 *
 * `mintGuardianKeySheet` runs client-side. The secret exists as the printed
 * code and in this page's memory; `guardians.accept` receives the public half
 * and nothing else.
 */
export function AcceptFlow({
  token,
  ownerName,
}: {
  token: string
  ownerName: string
}) {
  const locale = useLocale()
  const labels = t(GUARDIAN, locale)
  const accept = useMutation(api.guardians.accept)
  const [phase, setPhase] = useState<Phase>({ step: "review" })
  const [typed, setTyped] = useState("")
  const [busy, setBusy] = useState(false)

  async function finish(sheet: GuardianKeySheet) {
    if (!guardianKeyMatches(typed, sheet.publicKey)) {
      setPhase({ step: "confirm", sheet, error: "mismatch" })
      return
    }
    setBusy(true)
    try {
      await accept({
        inviteToken: token,
        // `@workspace/crypto` builds its outputs with `subarray`, so the
        // underlying buffer can be larger than the view — passing it raw would
        // ship trailing bytes and fail the 32-byte check on the server.
        x25519PublicKey: new Uint8Array(sheet.publicKey).buffer,
      })
      setPhase({ step: "done" })
    } catch {
      setPhase({ step: "confirm", sheet, error: "failed" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Unauthenticated>
        <div className="max-w-[560px]">
          <p className="text-[17px] leading-[1.7] opacity-80">
            {labels.signInFirst}
          </p>
          <Link
            href={`/sign-in?redirect_url=/guardian/accept?token=${token}`}
            className="bg-secondary text-secondary-foreground font-heading mt-6 inline-flex h-[60px] items-center rounded-full px-9 text-[18px] font-extrabold"
          >
            {labels.signIn}
          </Link>
        </div>
      </Unauthenticated>

      <Authenticated>
        {phase.step === "review" && (
          <Review
            labels={labels}
            ownerName={ownerName}
            onAccept={() =>
              setPhase({ step: "sheet", sheet: mintGuardianKeySheet() })
            }
          />
        )}

        {phase.step === "sheet" && (
          <Sheet
            labels={labels}
            sheet={phase.sheet}
            onNext={() => setPhase({ step: "confirm", sheet: phase.sheet })}
          />
        )}

        {phase.step === "confirm" && (
          <Confirm
            labels={labels}
            typed={typed}
            busy={busy}
            error={phase.error}
            onType={setTyped}
            onConfirm={() => void finish(phase.sheet)}
          />
        )}

        {phase.step === "done" && <Done labels={labels} />}
      </Authenticated>
    </>
  )
}

/** What you will do, beside what you will never be asked. */
function Review({
  labels,
  ownerName,
  onAccept,
}: {
  labels: Resolved<typeof GUARDIAN>
  ownerName: string
  onAccept: () => void
}) {
  return (
    <>
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden
          className="bg-secondary h-1 w-[54px] shrink-0 rounded-full"
        />
        <span className="text-olive-700 text-[14px] font-semibold">
          {labels.eyebrow}
        </span>
      </div>

      <h1 className="mt-[34px] mb-[26px] text-[40px] leading-[1.08] font-black tracking-[-0.02em] md:text-[66px]">
        {labels.titleOne.replace("{name}", ownerName)}
        <br />
        <span className="text-secondary">{labels.titleTwo}</span>
      </h1>

      <p className="mb-11 max-w-[620px] text-[17px] leading-[1.68] opacity-[.76] md:text-[19px]">
        {labels.lede}
      </p>

      <div className="mb-11 grid gap-9 md:grid-cols-2 md:gap-[34px]">
        <div>
          <div className="text-olive-700 mb-[18px] text-[13px] font-semibold tracking-[.1em] uppercase">
            {labels.willTitle}
          </div>
          <Row
            tone="olive"
            title={labels.willConfirm}
            body={labels.willConfirmBody}
          />
          <Divider inset />
          <Row
            tone="olive"
            title={labels.willHandover}
            body={labels.willHandoverBody}
          />
        </div>

        <div>
          <div className="text-terracotta-700 mb-[18px] text-[13px] font-semibold tracking-[.1em] uppercase">
            {labels.neverTitle}
          </div>
          <Never text={labels.neverSee} />
          <Divider />
          <Never text={labels.neverDivide} />
          <Divider />
          <Never text={labels.neverPay} />
          <Divider />
          <Never text={labels.neverStart} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={onAccept}
          className="bg-secondary text-secondary-foreground hover:bg-olive-600 font-heading inline-flex h-[68px] items-center gap-[11px] rounded-full px-10 text-[19px] font-extrabold transition-colors"
        >
          {labels.accept}
          <ArrowRightIcon
            className="size-5 rtl:-scale-x-100"
            strokeWidth={2.75}
            aria-hidden
          />
        </button>
        <Link
          href="/"
          className="text-[14.5px] font-semibold opacity-60 hover:opacity-100"
        >
          {labels.decline}
        </Link>
        <span className="max-w-[340px] text-[14px] leading-[1.55] opacity-60">
          {labels.expiryNote}
        </span>
      </div>
    </>
  )
}

function Row({
  title,
  body,
}: {
  tone: "olive"
  title: string
  body: string
}) {
  return (
    <div className="flex gap-4 py-4">
      <span
        aria-hidden
        className="bg-secondary text-secondary-foreground mt-0.5 grid size-[26px] flex-none place-items-center rounded-full"
      >
        <CheckIcon className="size-3.5" strokeWidth={3} />
      </span>
      <div>
        <div className="mb-1 text-[16.5px] font-semibold md:text-[17.5px]">
          {title}
        </div>
        <div className="text-[14.5px] leading-[1.65] opacity-[.68]">{body}</div>
      </div>
    </div>
  )
}

function Never({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-4 py-4">
      <XIcon
        className="text-terracotta-700 size-5 flex-none"
        strokeWidth={2.6}
        aria-hidden
      />
      <div className="text-[15.5px] leading-[1.55] md:text-[16.5px]">
        {text}
      </div>
    </div>
  )
}

function Divider({ inset = false }: { inset?: boolean }) {
  return (
    <div
      aria-hidden
      className={`bg-border h-px ${inset ? "ms-[42px]" : "ms-9"}`}
    />
  )
}

/**
 * The sheet.
 *
 * Rendered as chips rather than one long string because a person reading it off
 * a screen to copy onto paper loses their place in a 56-character run. The
 * prefix gets a chip of its own so the grid stays square.
 */
function Sheet({
  labels,
  sheet,
  onNext,
}: {
  labels: Resolved<typeof GUARDIAN>
  sheet: GuardianKeySheet
  onNext: () => void
}) {
  const [copied, setCopied] = useState(false)
  const groups = sheet.code.split("-")

  return (
    <>
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden
          className="bg-secondary h-1 w-[54px] shrink-0 rounded-full"
        />
        <span className="text-olive-700 text-[14px] font-semibold">
          {labels.createdNow}
        </span>
      </div>

      <h1 className="mt-[30px] mb-6 text-[38px] leading-[1.1] font-black tracking-[-0.02em] md:text-[58px]">
        {labels.keyTitleOne}
        <br />
        <span className="text-secondary">{labels.keyTitleTwo}</span>
      </h1>

      {/* The sentence the whole ceremony rests on. */}
      <p className="mb-10 max-w-[640px] text-[17px] leading-[1.68] opacity-[.76] md:text-[19px]">
        {labels.keyLede}
      </p>

      <div className="max-w-[640px]">
        <div className="mb-5 rounded-[28px] border-2 border-[color:var(--border)] bg-white px-8 py-[30px]">
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-heading flex-1 text-[18px] font-extrabold">
              {labels.sheetTitle}
            </span>
          </div>

          <div
            dir="ltr"
            className="mb-5 grid grid-cols-3 gap-2.5 sm:grid-cols-4"
          >
            {groups.map((group, index) => (
              <span
                key={`${group}-${index}`}
                className="bg-background rounded-[12px] py-[11px] text-center font-mono text-[14px] font-semibold"
              >
                {group}
              </span>
            ))}
          </div>

          <p className="text-[13.5px] leading-[1.65] opacity-70">
            {labels.sheetNote}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-secondary text-secondary-foreground hover:bg-olive-600 inline-flex h-[60px] flex-1 items-center justify-center gap-2.5 rounded-full text-[16px] font-bold transition-colors"
          >
            <PrinterIcon className="size-5" strokeWidth={2.4} aria-hidden />
            {labels.print}
          </button>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(sheet.code)
              setCopied(true)
            }}
            className="hover:bg-sand-200 inline-flex h-[60px] items-center justify-center rounded-full border-[1.5px] border-[color:var(--border)] px-8 text-[16px] font-bold transition-colors"
          >
            {copied ? labels.copied : labels.copy}
          </button>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="font-heading mt-6 inline-flex items-center gap-2.5 text-[17px] font-extrabold"
        >
          {labels.confirmTitle}
          <ArrowRightIcon
            className="size-5 rtl:-scale-x-100"
            strokeWidth={2.75}
            aria-hidden
          />
        </button>
      </div>
    </>
  )
}

function Confirm({
  labels,
  typed,
  busy,
  error,
  onType,
  onConfirm,
}: {
  labels: Resolved<typeof GUARDIAN>
  typed: string
  busy: boolean
  error?: "mismatch" | "failed"
  onType: (value: string) => void
  onConfirm: () => void
}) {
  return (
    <div className="max-w-[640px]">
      <h1 className="mb-5 text-[38px] leading-[1.1] font-black md:text-[52px]">
        {labels.confirmTitle}
      </h1>
      <p className="mb-9 text-[17px] leading-[1.7] opacity-80">
        {labels.confirmBody}
      </p>

      <label className="mb-2.5 block text-[14px] font-semibold">
        {labels.confirmLabel}
      </label>
      <input
        dir="ltr"
        value={typed}
        onChange={(event) => onType(event.target.value)}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="characters"
        placeholder="WSYG1-…"
        className="bg-card border-secondary h-[70px] w-full rounded-full border-2 px-[26px] font-mono text-[17px] font-semibold tracking-[.06em] outline-none"
      />
      {error !== undefined && (
        <p className="text-terracotta-800 mt-3 text-[14px] leading-[1.65]">
          {error === "mismatch" ? labels.confirmMismatch : labels.confirmFailed}
        </p>
      )}

      <button
        type="button"
        onClick={onConfirm}
        disabled={busy || typed.trim().length === 0}
        className="bg-secondary text-secondary-foreground hover:bg-olive-600 font-heading mt-7 inline-flex h-[68px] items-center rounded-full px-10 text-[19px] font-extrabold transition-colors disabled:opacity-50"
      >
        {busy ? labels.confirmBusy : labels.confirmAction}
      </button>
    </div>
  )
}

function Done({ labels }: { labels: Resolved<typeof GUARDIAN> }) {
  return (
    <div className="bg-secondary text-secondary-foreground max-w-[720px] rounded-[34px] px-8 py-10 md:px-11">
      <CheckIcon className="mb-6 size-9" strokeWidth={2.4} aria-hidden />
      <h1 className="mb-5 text-[36px] leading-[1.08] font-black md:text-[46px]">
        {labels.doneTitle}
      </h1>
      <p className="mb-8 max-w-[520px] text-[17px] leading-[1.72] opacity-90">
        {labels.doneBody}
      </p>
      <Link
        href="/guardian"
        className="text-secondary font-heading inline-flex h-[60px] items-center rounded-full bg-[color:var(--secondary-foreground)] px-9 text-[18px] font-extrabold"
      >
        {labels.doneAction}
      </Link>
    </div>
  )
}
