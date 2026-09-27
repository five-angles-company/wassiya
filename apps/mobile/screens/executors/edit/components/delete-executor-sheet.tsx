import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { ConfirmSheet } from "@workspace/ui-native/components/wassiya/confirm-sheet"
import { router } from "expo-router"

import { useStrings } from "@/i18n/use-strings"

/**
 * Deleting an executor. Removing the only one means no delivery is ever
 * created, so what the owner handed over reaches nobody; that is said here, at
 * the last moment it can change anything.
 */
export type DeleteExecutorSheetProps = {
  executorId: Id<"executors">
  name: string
  isOnly: boolean
  open: boolean
  onClose: () => void
}

export function DeleteExecutorSheet({
  executorId,
  name,
  isOnly,
  open,
  onClose,
}: DeleteExecutorSheetProps) {
  const { t } = useStrings("executors/edit")
  const remove = useMutation(api.executors.remove)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function destroy(dismiss: () => Promise<void>) {
    setBusy(true)
    setFailed(false)
    try {
      await remove({ executorId })
      await dismiss()
      // `replace`: the screen behind is an edit form for someone who no longer
      // exists.
      router.replace("/executors")
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }

  return (
    <ConfirmSheet
      open={open}
      onClose={onClose}
      title={t.deleteTitle!.replace("{name}", name)}
      body={[
        (isOnly ? t.deleteLast! : t.deleteBody!).replace("{name}", name),
        t.deleteFinal!,
      ]}
      confirmLabel={t.deletePermanently!}
      busyLabel={t.deleting}
      cancelLabel={t.keepIt!}
      onConfirm={(dismiss) => void destroy(dismiss)}
      busy={busy}
      error={failed ? t.deleteFailed! : null}
    />
  )
}
