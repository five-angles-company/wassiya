"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import { useAction, useQuery } from "convex/react"
import { BadgeCheckIcon, IdCardIcon, ScanFaceIcon, ShieldCheckIcon, SmartphoneIcon } from "lucide-react"

import { Button, ButtonLink } from "@/components/button"
import { CopyButton } from "@/components/copy-button"
import { IconDisc } from "@/components/icon-disc"
import { useLocale } from "@/components/locale-provider"
import { fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { CLAIM_IDENTITY } from "@/features/claims/strings/claim-identity"

/**
 * The identity check, as the body of an `Ask` (so: no cards of its own).
 *
 * - The provider runs in a **popup**: a redirect would lose this page, and an
 *   iframe cannot host a camera permission prompt reliably. A blocked popup
 *   gets a visible fallback link, never a dead button.
 * - The provider URL is copyable because laptop cameras often fail to read an
 *   ID; opening the link on a phone continues the same session.
 * - Nothing polls: `identity.status` is a Convex query, so the webhook's verdict
 *   arrives on its own.
 * - `pending` still offers the button, and must. Restarting is safe:
 *   `startSession` refuses only a verified user, attempts rise on a *declined
 *   verdict* rather than on opening a session, and the webhook resolves its
 *   subject by `vendor_data` first, so an abandoned session still lands right.
 */
export function IdentityPanel({
  returnTo = "/",
}: {
  /** Where the provider sends the reader back — the page the panel sits on. */
  returnTo?: string
}) {
  const locale = useLocale()
  const labels = t(CLAIM_IDENTITY, locale)
  const status = useQuery(api.identity.status, {})
  const startSession = useAction(api.identity.startSession)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [providerUrl, setProviderUrl] = useState<string | null>(null)

  const state = status?.status ?? "unverified"

  async function begin() {
    setBusy(true)
    setError(null)
    try {
      // The provider is another origin, so the return address is absolute.
      // This only runs from a click, so `window` exists.
      const { url } = await startSession({ callbackUrl: `${window.location.origin}${returnTo}` })
      setProviderUrl(url)
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
      <div className="bg-tone-settled-soft rounded-row flex items-start gap-4 p-5">
        <IconDisc icon={BadgeCheckIcon} tone="settled" size="sm" shape="circle" className="bg-card" />
        <div>
          <p className="text-tone-settled font-heading text-[17px] font-extrabold">{labels.verified}</p>
          <p className="text-foreground/75 mt-1 text-[14px] leading-[1.75]">{labels.privacy}</p>
        </div>
      </div>
    )
  }

  const checks = [
    { icon: IdCardIcon, label: labels.checkDocument },
    { icon: ScanFaceIcon, label: labels.checkFace },
  ]

  return (
    <div className="flex flex-col gap-5">
      <p className="text-foreground/75 max-w-[62ch] text-[15.5px] leading-[1.85]">{labels.intro}</p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {checks.map((check) => (
          <li key={check.label} className="bg-background/70 border-border rounded-row flex items-center gap-3 border p-3.5">
            <IconDisc icon={check.icon} tone="attention" size="sm" />
            <span className="text-[15px] font-semibold">{check.label}</span>
          </li>
        ))}
      </ul>

      {status !== null && status !== undefined && status.attemptsRemaining === 0 ? (
        <p className="text-tone-attention text-[15px] leading-[1.75] font-semibold">{labels.exhausted}</p>
      ) : (
        <div className="flex flex-col items-start gap-3">
          {state === "pending" && (
            <div className="flex flex-col gap-1">
              <p className="text-[15px] leading-[1.75]">{labels.pending}</p>
              <p className="text-muted-foreground text-[14px] leading-[1.7]">{labels.pendingWait}</p>
            </div>
          )}
          <Button size="lg" onClick={() => void begin()} disabled={busy}>
            {busy ? labels.starting : state === "pending" ? labels.resume : labels.startVerify}
          </Button>
          <p className="text-muted-foreground text-[13px]">{labels.popupNote}</p>
          {state === "rejected" && status !== null && status !== undefined && (
            <p className="text-tone-attention text-[14.5px] leading-[1.7] font-semibold">
              {labels.rejected.replace("{n}", fmtNumber(status.attemptsRemaining, locale))}
            </p>
          )}
        </div>
      )}

      {providerUrl !== null && (
        <div className="bg-background/70 border-border rounded-row flex items-start gap-4 border p-5">
          <IconDisc icon={SmartphoneIcon} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-[15.5px] font-bold">{labels.handoffTitle}</p>
            <p className="text-foreground/70 mt-1 text-[14px] leading-[1.7]">{labels.handoffBody}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton value={providerUrl} label={labels.copyLink} />
              <ButtonLink href={providerUrl} variant="outline" size="sm" target="_blank" rel="noreferrer">
                {labels.openInTab}
              </ButtonLink>
            </div>
          </div>
        </div>
      )}

      <p className="text-muted-foreground flex items-start gap-2 text-[13px] leading-[1.7]">
        <ShieldCheckIcon className="text-tone-settled mt-0.5 size-4 shrink-0" strokeWidth={2.25} aria-hidden />
        {labels.privacy}
      </p>

      {error !== null && <p className="text-tone-attention text-[14.5px] leading-[1.7] font-semibold">{error}</p>}
    </div>
  )
}
