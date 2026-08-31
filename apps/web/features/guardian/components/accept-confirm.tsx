"use client"

import { Button } from "@/components/button"
import { TextInput } from "@/components/text-input"
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
      <h1 className="font-heading mb-4 text-[26px] leading-[1.15] font-black md:text-[32px]">
        {labels.confirmTitle}
      </h1>
      <p className="mb-7 text-[15.5px] leading-[1.72] opacity-80">
        {labels.confirmBody}
      </p>

      <label className="mb-2.5 block text-[14px] font-semibold">
        {labels.confirmLabel}
      </label>
      <TextInput
        mono
        value={typed}
        onChange={(event) => onType(event.target.value)}
        placeholder="WSYG1-…"
        invalid={error !== undefined}
      />
      {error !== undefined && (
        <p className="text-terracotta-800 mt-3 text-[14px] leading-[1.65]">
          {error === "mismatch" ? labels.confirmMismatch : labels.confirmFailed}
        </p>
      )}

      <Button
        variant="secondary"
        size="lg"
        className="mt-6"
        onClick={onConfirm}
        disabled={busy || typed.trim().length === 0}
      >
        {busy ? labels.confirmBusy : labels.confirmAction}
      </Button>
    </div>
  )
}
