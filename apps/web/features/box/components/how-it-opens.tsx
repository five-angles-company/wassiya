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
 * Drawn on ink rather than sand. It is the only dark surface in the app, and it
 * earns that by being the only thing on screen that is *about* the encryption
 * rather than about the reader's own situation.
 */
export function HowItOpens() {
  const labels = t(HEIR_BOX, useLocale())

  return (
    <aside className="rounded-sheet bg-[#201e1d] px-7 pt-8 pb-9 text-[#f5ead8]">
      <div className="mb-6 text-[12px] font-semibold tracking-[.14em] uppercase opacity-50">
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
          className="font-heading flex-none text-[22px] font-black opacity-40"
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
        <ArrowDownIcon className="size-5 opacity-40" strokeWidth={2.4} aria-hidden />
      </div>

      <div className="mb-5 rounded-[22px] border-2 border-[color:rgba(245,234,216,.28)] px-5 py-6 text-center">
        <LaptopIcon className="mx-auto mb-2 size-5" strokeWidth={2.4} aria-hidden />
        <div className="font-heading mb-1.5 text-[16px] font-extrabold">
          {labels.opensHere}
        </div>
        <div className="text-[12.5px] leading-[1.6] opacity-60">
          {labels.opensHereMeta}
        </div>
      </div>

      <p className="text-[13px] leading-[1.75] opacity-60">{labels.twoNotOne}</p>
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
      <div className="font-heading mb-1 text-[15px] font-extrabold">{title}</div>
      <div className="text-[12px] opacity-85">{meta}</div>
    </div>
  )
}
