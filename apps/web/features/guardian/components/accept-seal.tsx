"use client"

import { CheckIcon, XIcon } from "lucide-react"

import { Button } from "@/components/button"
import { Paper } from "@/components/doc/paper"
import { Prose } from "@/components/doc/prose"
import { SetApart } from "@/components/doc/set-apart"
import { DocTitle } from "@/components/doc/title"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import type { Resolved } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import {
  deviceKeySupported,
  type SaveOutcome,
} from "@/features/guardian/lib/device-key"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"
import type { GUARDIAN } from "@/features/guardian/strings/guardian"

/**
 * Keeping a second copy on this device — the step that ends the invitation.
 *
 * ## Why it is its own screen
 *
 * It shared one with the key, where it competed with a print button, a copy
 * button and a link straight past it. Split out, it is the only thing being
 * asked, which is what it actually is: after this the public key is published
 * and every heir bundle seals to it.
 *
 * ## ⚠️ Required where it can be done, never a dead end
 *
 * The road that types the code back is deliberately **not** offered beside the
 * fingerprint. It appears only once sealing has demonstrably not happened — an
 * unsupported browser, or a prompt the reader dismissed.
 *
 * Both halves of that matter. Offered side by side, the fingerprint is a
 * suggestion with an easier way past it. Removed entirely, a dismissed prompt
 * is a guardian who cannot accept at all — and the paper is the durable copy
 * regardless: a device can be lost or wiped, and only the sheet brings the key
 * back. So it is the step, and there is always a way forward.
 *
 * A browser that cannot seal goes straight to the typed road, with no failed
 * attempt to sit through first.
 *
 * ## It carries the reasoning, because it carries one action
 *
 * Split off with only a title and a button, this was a paragraph and a control
 * in an otherwise empty page — and the emptiness read as a screen that had
 * failed to load rather than a screen with one thing on it.
 *
 * What fills it is not padding: a reader being asked for a fingerprint is owed
 * what it buys and what it does **not** replace, and the second half is the one
 * that matters here. The two cards are the same device the invitation uses for
 * the same reason — two bounded lists are read against each other.
 */
export function AcceptSeal({
  labels,
  busy,
  outcome,
  onKeepOnDevice,
  onNext,
}: {
  labels: Resolved<typeof GUARDIAN>
  busy: boolean
  /** Set only when a seal was attempted and did not happen. */
  outcome?: SaveOutcome
  onKeepOnDevice: () => void
  onNext: () => void
}) {
  const locale = useLocale()
  const duties = t(GUARDIAN_DUTIES, locale)
  const common = t(COMMON, locale)
  const canSeal = deviceKeySupported()

  return (
    <article className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <DocTitle title={canSeal ? labels.sealTitle : labels.confirmTitle} />
        <Prose>
          <p>{canSeal ? duties.deviceKeyOfferBody : labels.confirmBody}</p>
        </Prose>
      </div>

      {canSeal && (
        <div className="grid gap-5 md:grid-cols-2">
          <Paper className="flex flex-col gap-4 p-6">
            <h2 className="text-tone-settled text-[12px] font-bold tracking-wide uppercase">
              {labels.sealGainsTitle}
            </h2>
            <ul className="flex flex-col gap-3.5">
              {[labels.sealGainOne, labels.sealGainTwo].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <CheckIcon
                    className="text-tone-settled mt-0.5 size-4 shrink-0"
                    strokeWidth={2.8}
                    aria-hidden
                  />
                  <span className="text-[15px] leading-[1.55]">{line}</span>
                </li>
              ))}
            </ul>
          </Paper>

          <Paper className="flex flex-col gap-4 p-6">
            <h2 className="text-tone-attention text-[12px] font-bold tracking-wide uppercase">
              {labels.sealLimitsTitle}
            </h2>
            <ul className="flex flex-col gap-3.5">
              {[labels.sealLimitOne, labels.sealLimitTwo].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <XIcon
                    className="text-tone-attention mt-0.5 size-4 shrink-0"
                    strokeWidth={2.8}
                    aria-hidden
                  />
                  <span className="text-[15px] leading-[1.55]">{line}</span>
                </li>
              ))}
            </ul>
          </Paper>
        </div>
      )}

      <SetApart className="flex flex-col gap-4">
        <p className="text-surface-accent-ink text-[12px] font-bold tracking-wide uppercase">
          {common.askEyebrow}
        </p>

        <Button
          variant="secondary"
          size="lg"
          className="self-start"
          onClick={canSeal ? onKeepOnDevice : onNext}
          disabled={busy}
        >
          {canSeal
            ? busy
              ? duties.deviceKeySaving
              : duties.deviceKeyOfferAction
            : labels.confirmTitle}
        </Button>

        {canSeal && outcome === undefined && (
          <p className="text-muted-foreground max-w-[66ch] text-[13.5px] leading-[1.7]">
            {labels.sealPaperKept}
          </p>
        )}

        {/* Two roads out, because a failed seal has two causes with different
            answers. The platform prompt lets the reader hand the request to
            another device — a phone usually does have PRF where a laptop's own
            authenticator does not — so retrying is worth offering, and the
            paper is always there. */}
        {canSeal && outcome !== undefined && (
          <div className="border-border flex flex-col gap-3 border-t pt-4">
            <p className="text-muted-foreground max-w-[66ch] text-[13.5px] leading-[1.7]">
              {outcome === "unsupported"
                ? duties.deviceKeyUnsupported
                : duties.deviceKeyDeclined}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button
                variant="outline"
                onClick={onKeepOnDevice}
                disabled={busy}
              >
                {duties.deviceKeyRetry}
              </Button>
              <button
                type="button"
                onClick={onNext}
                disabled={busy}
                className="decoration-surface-accent text-[15px] font-semibold underline decoration-2 underline-offset-4 disabled:opacity-50"
              >
                {labels.confirmTitle}
              </button>
            </div>
          </div>
        )}
      </SetApart>
    </article>
  )
}
