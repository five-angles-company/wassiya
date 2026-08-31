"use client"

import {
  ArrowDownIcon,
  KeyRoundIcon,
  LaptopIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { HEIR_BOX } from "@/features/box/strings/heir-box"

/**
 * The mechanism, drawn.
 *
 * This is the one place in the product where exposing how the cryptography
 * works builds trust instead of confusing — because the reader is standing in
 * front of the exact gate it explains. Everywhere else, the same diagram would
 * be a lecture.
 *
 * It was drawn on ink, as the one dark surface in the app. Every card here is
 * `--card` now — a second surface colour for a single block is exactly the
 * noise that made these pages loud — so what marks it out is the two coloured
 * halves inside it, which is the diagram itself rather than decoration around
 * it.
 */
export function HowItOpens() {
  const labels = t(HEIR_BOX, useLocale())

  return (
    <aside className="bg-card border-border rounded-sheet border px-7 pt-8 pb-9 shadow-[var(--shadow-raised)]">
      <div className="text-muted-foreground mb-6 text-[12px] font-semibold tracking-[.14em] uppercase">
        {labels.howTitle}
      </div>

      <div className="mb-5 flex items-center gap-3">
        <Half
          icon={KeyRoundIcon}
          title={labels.ourHalf}
          meta={labels.ourHalfMeta}
          className="bg-primary text-primary-foreground"
        />
        <span
          aria-hidden
          className="font-heading text-muted-foreground flex-none text-[22px] font-black"
        >
          +
        </span>
        <Half
          icon={ShieldCheckIcon}
          title={labels.guardianHalf}
          meta={labels.guardianHalfMeta}
          className="bg-secondary text-secondary-foreground"
        />
      </div>

      <div className="mb-5 flex justify-center">
        <ArrowDownIcon className="text-muted-foreground size-5" strokeWidth={2.4} aria-hidden />
      </div>

      <div className="border-border bg-background mb-5 rounded-[22px] border px-5 py-6 text-center">
        <LaptopIcon className="mx-auto mb-2 size-5" strokeWidth={2.4} aria-hidden />
        <div className="font-heading mb-1.5 text-[15.5px] font-extrabold">
          {labels.opensHere}
        </div>
        <div className="text-muted-foreground text-[12.5px] leading-[1.6]">
          {labels.opensHereMeta}
        </div>
      </div>

      <p className="text-muted-foreground text-[13px] leading-[1.75]">{labels.twoNotOne}</p>
    </aside>
  )
}

function Half({
  icon: Icon,
  title,
  meta,
  className,
}: {
  icon: typeof KeyRoundIcon
  title: string
  meta: string
  className: string
}) {
  return (
    <div className={`flex-1 rounded-[22px] px-4 py-5 text-center ${className}`}>
      <Icon className="mx-auto mb-2 size-5" strokeWidth={2.4} aria-hidden />
      <div className="font-heading mb-1 text-[15.5px] font-extrabold">{title}</div>
      <div className="text-[12px] opacity-85">{meta}</div>
    </div>
  )
}
