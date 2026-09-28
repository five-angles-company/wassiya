/**
 * ٩.١ — deleting the account, and taking the request back.
 *
 * Asking is behind the fingerprint, like the check-in: an unlocked phone in the
 * wrong hands must not destroy a vault with a tap, and `disableDeviceFallback`
 * stays true because a passcode is something the person holding the phone may
 * know. Cancelling needs no fingerprint — it only keeps the vault.
 */
import { useState } from "react"
import { useMutation } from "convex/react"
import { ConvexError } from "convex/values"
import { api } from "@workspace/backend/api"
import { ConfirmSheet } from "@workspace/ui-native/components/wassiya/confirm-sheet"
import { SettingsRow } from "@workspace/ui-native/components/wassiya/settings-row"
import { fmtDate } from "@workspace/ui-native/lib/format"
import * as LocalAuthentication from "expo-local-authentication"
import { Trash2 } from "lucide-react-native"

import { useStrings } from "@/i18n/use-strings"

export function DeleteAccount({ dueAt }: { dueAt: number | null }) {
  const { t, locale } = useStrings("settings")
  const request = useMutation(api.account.requestDeletion)
  const cancel = useMutation(api.account.cancelDeletion)

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function close() {
    setOpen(false)
    setError(null)
  }

  async function schedule(dismiss: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: t.deletePrompt!,
        disableDeviceFallback: true,
      })
      if (!auth.success) {
        setError(t.deleteNotConfirmed!)
        return
      }
      await request({})
      await dismiss()
    } catch (cause) {
      setError(refusal(cause, t))
    } finally {
      setBusy(false)
    }
  }

  async function keep(dismiss: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await cancel({})
      await dismiss()
    } catch {
      setError(t.keepFailed!)
    } finally {
      setBusy(false)
    }
  }

  const pending = dueAt !== null

  return (
    <>
      <SettingsRow
        icon={Trash2}
        label={t.rowDeleteAccount!}
        value={
          pending
            ? t.deleteScheduled!.replace(
                "{date}",
                fmtDate(new Date(dueAt), locale)
              )
            : undefined
        }
        valueTone="attention"
        onPress={() => setOpen(true)}
      />

      {pending ? (
        <ConfirmSheet
          open={open}
          onClose={close}
          title={t.keepTitle!}
          body={[t.keepBody!]}
          confirmLabel={t.keepConfirm!}
          cancelLabel={t.cancel!}
          onConfirm={(dismiss) => void keep(dismiss)}
          busy={busy}
          error={error}
        />
      ) : (
        <ConfirmSheet
          open={open}
          onClose={close}
          tone="danger"
          title={t.deleteTitle!}
          body={[t.deleteBody!, t.deleteFinal!]}
          confirmLabel={t.deleteConfirm!}
          cancelLabel={t.cancel!}
          onConfirm={(dismiss) => void schedule(dismiss)}
          busy={busy}
          error={error}
        />
      )}
    </>
  )
}

function refusal(cause: unknown, t: Record<string, string>): string {
  if (cause instanceof ConvexError) {
    const reason = (cause.data as { code?: string; reason?: string }).reason
    if (reason === "report_open") return t.deleteReportOpen!
    if (reason === "vault_closed") return t.deleteVaultClosed!
  }
  return t.deleteFailed!
}
