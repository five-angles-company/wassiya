"use client"

import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import { useMutation } from "convex/react"
import { RotateCcwIcon } from "lucide-react"
import { toast } from "sonner"

import { usePermissions } from "@/hooks/use-permissions"
import { ConfirmAction } from "@/components/confirm-action"
import { IDENTITY } from "@/features/identity/strings/identity"
import { t, type Locale } from "@/lib/i18n/locale"

/**
 * The console's second write, and the only one outside a claim.
 *
 * It hands a blocked owner their Didit attempts back. The mobile app tells
 * someone who has failed three times to contact support; until this existed,
 * support had no way to act on that, which made the copy a dead end rather than
 * a handoff.
 *
 * **Neutral tone, not destructive** — the tone the shared dialog reserves for
 * genuinely irreversible things, which this is not: it grants a retry and can
 * be re-applied. The body still spells out the limit of what it does, because
 * the tempting misreading is that a reviewer just verified someone. They did
 * not, and there is deliberately no button that would.
 */
export function ResetAttempts({
  userId,
  name,
  locale,
}: {
  userId: Id<"users">
  name: string
  locale: Locale
}) {
  const labels = t(IDENTITY, locale)
  const { has } = usePermissions()
  const reset = useMutation(api.identity.adminResetAttempts)

  // Absent rather than disabled: a greyed-out control invites "why can't I?",
  // an absent one reads as "not my job". The refusal is in the mutation.
  if (!has("identity.reset")) return null

  return (
    <ConfirmAction
      tone="neutral"
      title={labels.resetDialogTitle}
      body={labels.resetDialogBody.replace("{name}", name)}
      confirmLabel={labels.resetConfirm}
      cancelLabel={labels.cancel}
      trigger={
        <Button variant="outline" size="sm">
          <RotateCcwIcon className="size-3.5" aria-hidden />
          {labels.reset}
        </Button>
      }
      onConfirm={async () => {
        try {
          await reset({ userId })
          toast.success(labels.toastReset)
        } catch (error) {
          // The mutation refuses an already-verified account, and that message
          // is worth showing rather than replacing with a generic failure.
          toast.error(
            error instanceof Error ? error.message : labels.toastFailed
          )
        }
      }}
    />
  )
}
