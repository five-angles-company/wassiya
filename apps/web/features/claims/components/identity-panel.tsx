"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import { useAction, useQuery } from "convex/react"
import { BadgeCheckIcon, ScanFaceIcon } from "lucide-react"

import { CopyButton } from "@/components/copy-button"
import { Panel } from "@/components/panel"
import { useLocale } from "@/components/locale-provider"
import { fmtNumber, fmtStepNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { CLAIM_IDENTITY } from "@/features/claims/strings/claim-identity"

/**
 * ٧.٢ — the identity check, as a panel on the report rather than a wizard step.
 *
 * ## The popup, and what happens when it is blocked
 *
 * The board wants the provider *"in a secure window"* rather than an iframe or
 * a redirect. A redirect would lose the page the reader is on; an iframe cannot
 * host a camera permission prompt reliably. So `window.open`, with a **visible
 * fallback** when the browser blocks it — a blocked popup with no explanation
 * is one of the board's own listed states and is otherwise a dead end on the
 * first real step.
 *
 * ## The phone hand-off
 *
 * *"laptop webcams fail document capture, and asking the user to start over on
 * a phone loses them."* The provider URL is a normal link, so the fix is to
 * make it copyable: open it on a phone and the same session continues. A QR
 * would need a client library; a copy button needs none and works when a camera
 * is the thing you are trying to avoid using.
 *
 * ## Nothing polls
 *
 * `identity.status` is a Convex query, so the Didit webhook's write pushes the
 * verdict here on its own. The reader can close the popup and watch this panel.
 */
export function IdentityPanel() {
  const locale = useLocale()
  const labels = t(CLAIM_IDENTITY, locale)
  const status = useQuery(api.identity.status, {})
  const startSession = useAction(api.identity.startSession)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [providerUrl, setProviderUrl] = useState<string | null>(null)

  const checks = [labels.checkDocument, labels.checkFace, labels.checkCode]
  const state = status?.status ?? "unverified"

  async function begin() {
    setBusy(true)
    setError(null)
    try {
      const { url } = await startSession({
        // Back to this app's own reports list. The provider is a separate
        // origin, so this has to be absolute; on the server there is no
        // `window`, but this only runs from a click.
        callbackUrl: `${window.location.origin}/claims`,
      })
      setProviderUrl(url)
      // `null` means the browser blocked it. Say so and offer the link rather
      // than leaving the button looking broken.
      if (window.open(url, "_blank", "width=520,height=720") === null) {
        setError(labels.popupBlocked)
      }
    } catch {
      setError(labels.failed)
    } finally {
      setBusy(false)
    }
  }

  if (state === "verified") {
    return (
      <Panel tone="settled" icon={BadgeCheckIcon} title={labels.verified}>
        <p className="text-[14px] leading-[1.7] opacity-90">
          {labels.privacyNote}
        </p>
      </Panel>
    )
  }

  return (
    <Panel tone="now" icon={ScanFaceIcon} title={labels.heading}>
      <p className="mb-5 max-w-[62ch] text-[14.5px] leading-[1.7] opacity-80">
        {labels.intro}
      </p>

      <ol className="mb-5 flex flex-col gap-3">
        {checks.map((check, index) => (
          <li key={check} className="flex items-start gap-3">
            <span
              aria-hidden
              className="bg-primary text-primary-foreground grid size-6 shrink-0 place-items-center rounded-full text-[12.5px] font-bold"
            >
              {fmtStepNumber(index + 1, locale)}
            </span>
            <span className="text-[14.5px] leading-[1.55]">{check}</span>
          </li>
        ))}
      </ol>

      {state === "pending" ? (
        <p className="text-[14px] leading-[1.7] opacity-80">{labels.pending}</p>
      ) : status !== null && status !== undefined && status.attemptsRemaining === 0 ? (
        <p className="text-[14px] leading-[1.7] opacity-80">
          {labels.exhausted}
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={() => void begin()}
            disabled={busy}
            className="bg-primary text-primary-foreground hover:bg-terracotta-600 rounded-full px-7 py-3 text-[15px] font-semibold transition-colors disabled:opacity-50"
          >
            {busy ? labels.starting : labels.startVerify}
          </button>
          <p className="mt-2 text-[12.5px] opacity-60">{labels.popupNote}</p>
          {state === "rejected" && status !== null && status !== undefined && (
            <p className="mt-3 text-[14px] leading-[1.7]">
              {labels.rejected.replace(
                "{n}",
                fmtNumber(status.attemptsRemaining, locale)
              )}
            </p>
          )}
        </>
      )}

      {/* Present for as long as a session exists, because the laptop-webcam
          failure is discovered *after* the popup opens. */}
      {providerUrl !== null && (
        <div className="bg-background rounded-card mt-5 p-4">
          <h3 className="text-[15px] font-semibold">{labels.handoffTitle}</h3>
          <p className="mt-1.5 text-[13.5px] leading-[1.65] opacity-70">
            {labels.handoffBody}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton value={providerUrl} label={labels.copyLink} />
            <a
              href={providerUrl}
              target="_blank"
              rel="noreferrer"
              className="border-border hover:bg-muted inline-flex items-center rounded-full border px-4 py-2 text-[13.5px] font-semibold transition-colors"
            >
              {labels.openInTab}
            </a>
          </div>
        </div>
      )}

      <div className="bg-background rounded-card mt-5 p-4">
        <h3 className="text-[15px] font-semibold">{labels.whyNumberTitle}</h3>
        <p className="mt-1.5 text-[13.5px] leading-[1.7] opacity-70">
          {labels.whyNumberBody}
        </p>
      </div>

      {error !== null && (
        <p className="mt-4 text-[14px] leading-[1.7]">{error}</p>
      )}
    </Panel>
  )
}
