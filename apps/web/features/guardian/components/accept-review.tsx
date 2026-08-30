"use client"

import Link from "next/link"
import { ArrowRightIcon, CheckIcon, XIcon } from "lucide-react"

import type { Resolved } from "@/lib/i18n/locale"
import type { GUARDIAN } from "@/features/guardian/strings/guardian"

/**
 * What you will do, beside what you will never be asked.
 *
 * The two columns are the screen's whole argument. A guardianship sounds like
 * an unbounded obligation until the second column bounds it — no liability, no
 * arbitration, no access to the vault, and no ability to start a release alone.
 * Reading the invitation without that list is what makes people decline.
 */
export function AcceptReview({
  labels,
  ownerName,
  onAccept,
}: {
  labels: Resolved<typeof GUARDIAN>
  ownerName: string
  onAccept: () => void
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="bg-secondary h-1 w-11 shrink-0 rounded-full"
        />
        <span className="text-olive-700 text-[13.5px] font-semibold">
          {labels.eyebrow}
        </span>
      </div>

      <h1 className="font-heading mt-6 mb-4 text-[28px] leading-[1.15] font-black md:text-[36px]">
        {labels.titleOne.replace("{name}", ownerName)}
        <br />
        <span className="text-secondary">{labels.titleTwo}</span>
      </h1>

      <p className="mb-8 max-w-[62ch] text-[15.5px] leading-[1.72] opacity-80">
        {labels.lede}
      </p>

      <div className="mb-8 grid gap-8 md:grid-cols-2">
        <div>
          <div className="text-olive-700 mb-3 text-[12.5px] font-semibold tracking-[.1em] uppercase">
            {labels.willTitle}
          </div>
          <Will title={labels.willConfirm} body={labels.willConfirmBody} />
          <span aria-hidden className="bg-border ms-[38px] block h-px" />
          <Will title={labels.willHandover} body={labels.willHandoverBody} />
        </div>

        <div>
          <div className="text-terracotta-700 mb-3 text-[12.5px] font-semibold tracking-[.1em] uppercase">
            {labels.neverTitle}
          </div>
          {[
            labels.neverSee,
            labels.neverDivide,
            labels.neverPay,
            labels.neverStart,
          ].map((text, index) => (
            <div key={text}>
              {index > 0 && (
                <span aria-hidden className="bg-border ms-8 block h-px" />
              )}
              <div className="flex items-center gap-3.5 py-3.5">
                <XIcon
                  className="text-terracotta-700 size-[18px] flex-none"
                  strokeWidth={2.6}
                  aria-hidden
                />
                <div className="text-[15px] leading-[1.55]">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={onAccept}
          className="bg-secondary text-secondary-foreground hover:bg-olive-600 font-heading inline-flex h-[58px] items-center gap-2.5 rounded-full px-9 text-[17px] font-extrabold transition-colors"
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
        <span className="max-w-[340px] text-[13.5px] leading-[1.55] opacity-60">
          {labels.expiryNote}
        </span>
      </div>
    </div>
  )
}

function Will({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-3.5 py-3.5">
      <span
        aria-hidden
        className="bg-secondary text-secondary-foreground mt-0.5 grid size-6 flex-none place-items-center rounded-full"
      >
        <CheckIcon className="size-3.5" strokeWidth={3} />
      </span>
      <div>
        <div className="mb-1 text-[15.5px] font-semibold">{title}</div>
        <div className="text-[14px] leading-[1.65] opacity-70">{body}</div>
      </div>
    </div>
  )
}
