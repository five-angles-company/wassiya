"use client"

import { ArrowRightIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { HowItOpens } from "@/features/box/components/how-it-opens"
import { HEIR_BOX } from "@/features/box/strings/heir-box"

/**
 * The gate is the screen, not an obstacle in front of it.
 *
 *   K_h = S_server_h ⊕ S_guardian_h
 *
 * `release.releasedBundleForHeir` hands over **only** `serverShare`; the other
 * half reaches the heir from a person. There is no path to an opened box that
 * skips that, and the design does not try to hide it — it draws it. Our half
 * and the guardian's, side by side, and the line that explains why it is built
 * this way: *"Two, never one."*
 *
 * That framing is the whole design. "Enter a key" is a chore. "Nobody can open
 * this alone, including us" is the product's central promise, arriving at the
 * exact moment it can be demonstrated rather than asserted.
 */
export function BoxGate({
  share,
  busy,
  error,
  onShareChange,
  onUnlock,
}: {
  share: string
  busy: boolean
  error?: string
  onShareChange: (value: string) => void
  onUnlock: () => void
}) {
  const labels = t(HEIR_BOX, useLocale())

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <h1 className="font-heading text-[26px] leading-tight font-extrabold md:text-[32px]">
          {labels.gateTitle}
        </h1>
        <p className="text-muted-foreground mt-3 max-w-[62ch] text-[15px] leading-[1.75]">
          {labels.gateBody}
        </p>

        <label className="mt-7 mb-2.5 block text-[14px] font-semibold">
          {labels.shareLabel}
        </label>
        {/* Bordered in terracotta rather than the usual hairline: it is the
            only input on the screen and the only thing being asked for. */}
        <input
          dir="ltr"
          value={share}
          onChange={(event) => onShareChange(event.target.value)}
          placeholder={labels.sharePlaceholder}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="characters"
          className="bg-card border-primary h-[62px] w-full max-w-[560px] rounded-full border-2 px-6 font-mono text-[15px] font-semibold tracking-[.06em] outline-none focus-visible:border-[color:var(--accent-foreground)]"
        />
        {error !== undefined && (
          <p className="text-terracotta-800 mt-3 max-w-[62ch] text-[14px] leading-[1.65]">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={onUnlock}
            disabled={busy || share.trim().length === 0}
            className="bg-primary text-primary-foreground hover:bg-terracotta-600 font-heading inline-flex h-[58px] items-center gap-2.5 rounded-full px-9 text-[17px] font-extrabold transition-colors disabled:opacity-50"
          >
            {busy ? labels.unlocking : labels.unlock}
            <ArrowRightIcon
              className="size-5 rtl:-scale-x-100"
              strokeWidth={2.75}
              aria-hidden
            />
          </button>
          <span className="text-muted-foreground max-w-[220px] text-[13.5px] leading-[1.55]">
            {labels.onDevice}
          </span>
        </div>

        <div className="bg-muted rounded-card mt-8 max-w-[640px] p-5">
          <div className="font-heading mb-2 text-[16px] font-extrabold">
            {labels.askTitle}
          </div>
          <p className="text-[14px] leading-[1.7] opacity-75">{labels.askBody}</p>
        </div>
      </div>

      <HowItOpens />
    </div>
  )
}
