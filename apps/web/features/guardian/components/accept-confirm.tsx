"use client"

import { Button } from "@/components/button"
import { Prose } from "@/components/doc/prose"
import { DocTitle } from "@/components/doc/title"
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
    <article className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <DocTitle title={labels.confirmTitle} />
        <Prose>
          <p>{labels.confirmBody}</p>
        </Prose>
      </div>

      {/* A form, so Return confirms — this is a code being copied off paper,
          and the same reasoning as `guardian-key.tsx`. The button rides inside
          the field rather than beside it. */}
      <form
        className="flex flex-col gap-2.5"
        onSubmit={(event) => {
          event.preventDefault()
          if (!busy && typed.trim().length > 0) onConfirm()
        }}
      >
        <label
          className="text-[13.5px] font-semibold"
          htmlFor="guardian-accept-code"
        >
          {labels.confirmLabel}
        </label>
        <TextInput
          id="guardian-accept-code"
          mono
          value={typed}
          onChange={(event) => onType(event.target.value)}
          placeholder="WSYG1-…"
          invalid={error !== undefined}
          action={
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={busy || typed.trim().length === 0}
            >
              {busy ? labels.confirmBusy : labels.confirmAction}
            </Button>
          }
        />
        {error !== undefined && (
          <p className="text-tone-attention max-w-[66ch] text-[14px] leading-[1.65]">
            {error === "mismatch" ? labels.confirmMismatch : labels.confirmFailed}
          </p>
        )}
      </form>
    </article>
  )
}
