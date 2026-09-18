"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import { useAction, useQuery } from "convex/react"

import { Button, ButtonLink } from "@/components/button"
import { CopyButton } from "@/components/copy-button"
import { DocSection } from "@/components/doc/section"
import { useLocale } from "@/components/locale-provider"
import { fmtNumber, fmtStepNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { CLAIM_IDENTITY } from "@/features/claims/strings/claim-identity"

/**
 * ٧.٢ — the identity check, as a panel on the report rather than a wizard step.
 *
 * The provider runs *"in a secure window"*: a redirect would lose the
 * page the reader is on, and an iframe cannot host a camera permission prompt
 * reliably. So `window.open`, with a **visible fallback** when the browser blocks
 * it — a blocked popup with no explanation is a dead end on the first real step.
 *
 * The provider URL is a normal link and is copyable, because *"laptop webcams
 * fail document capture, and asking the user to start over on a phone loses
 * them."* Opening it on a phone continues the same session. A QR would need a
 * client library; a copy button needs none.
 *
 * Nothing polls. `identity.status` is a Convex query, so the Didit webhook's
 * write pushes the verdict here on its own.
 *
 * ## `pending` still offers the button, and must
 *
 * It used to render one sentence and no control, which stranded anybody whose
 * popup was blocked, who closed the window, or who abandoned the phone handoff:
 * `providerUrl` is component state, so a refresh took the link with it and left
 * a page that asked for something it gave no way to do.
 *
 * Restarting is safe on all three counts that matter. `startSession` refuses
 * only a **verified** user; `identityAttempts` rises on a *declined verdict*,
 * never on opening a session; and the webhook resolves its subject by
 * `vendor_data` before `sessionId`, so a session abandoned and replaced still
 * lands on the right user if it ever completes.
 */
export function IdentityPanel({
  returnTo,
}: {
  /**
   * Where Didit sends the reader back to. Defaults to the reports list, which
   * is only right when the panel is not attached to a case — from a case page,
   * pass that case, or someone finishes a verification and is returned to a
   * list instead of the thing they were doing.
   */
  returnTo?: string
} = {}) {
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
        callbackUrl: `${window.location.origin}${returnTo ?? "/claims"}`,
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
      <DocSection title={labels.verified}>
        <p className="text-muted-foreground text-[14px] leading-[1.7]">
          {labels.privacyNote}
        </p>
      </DocSection>
    )
  }

  return (
    <div>
      <p className="text-muted-foreground mb-5 max-w-[66ch] text-[14.5px] leading-[1.7]">
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

      {status !== null && status !== undefined && status.attemptsRemaining === 0 ? (
        <p className="text-[14px] leading-[1.7] opacity-80">
          {labels.exhausted}
        </p>
      ) : (
        <>
          {state === "pending" && (
            <div className="mb-4 flex flex-col gap-2">
              <p className="text-[14px] leading-[1.7]">{labels.pending}</p>
              <p className="text-muted-foreground text-[13.5px] leading-[1.7]">
                {labels.pendingWait}
              </p>
            </div>
          )}

          <Button onClick={() => void begin()} disabled={busy}>
            {busy
              ? labels.starting
              : state === "pending"
                ? labels.resume
                : labels.startVerify}
          </Button>
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
        <div className="border-border mt-5 border-t pt-4">
          <h3 className="text-[15px] font-semibold">{labels.handoffTitle}</h3>
          <p className="mt-1.5 text-[13.5px] leading-[1.65] opacity-70">
            {labels.handoffBody}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton value={providerUrl} label={labels.copyLink} />
            <ButtonLink
              href={providerUrl}
              variant="outline"
              size="sm"
              target="_blank"
              rel="noreferrer"
            >
              {labels.openInTab}
            </ButtonLink>
          </div>
        </div>
      )}

      <div className="border-border mt-5 border-t pt-4">
        <h3 className="text-[15px] font-semibold">{labels.whyNumberTitle}</h3>
        <p className="mt-1.5 text-[13.5px] leading-[1.7] opacity-70">
          {labels.whyNumberBody}
        </p>
      </div>

      {error !== null && (
        <p className="mt-4 text-[14px] leading-[1.7]">{error}</p>
      )}
    </div>
  )
}
