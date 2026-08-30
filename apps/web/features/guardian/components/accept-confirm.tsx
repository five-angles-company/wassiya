"use client"

import type { Resolved } from "@/lib/i18n/locale"
import type { GUARDIAN } from "@/features/guardian/strings/guardian"

/**
 * Type it back once.
 *
 * The step that makes the whole ordering worth having: until this matches, no
 * public key is published and the invitation is unspent, so an abandoned
 * attempt costs nothing. After it, the key exists and every heir bundle for
 * this vault seals to it.
 */
export function AcceptConfirm({
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
      <h1 className="font-heading mb-4 text-[28px] leading-[1.15] font-black md:text-[34px]">
        {labels.confirmTitle}
      </h1>
      <p className="mb-7 text-[15.5px] leading-[1.72] opacity-80">
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
        className="bg-card border-secondary h-[62px] w-full rounded-full border-2 px-6 font-mono text-[15px] font-semibold tracking-[.06em] outline-none"
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
        className="bg-secondary text-secondary-foreground hover:bg-olive-600 font-heading mt-6 inline-flex h-[58px] items-center rounded-full px-9 text-[17px] font-extrabold transition-colors disabled:opacity-50"
      >
        {busy ? labels.confirmBusy : labels.confirmAction}
      </button>
    </div>
  )
}
