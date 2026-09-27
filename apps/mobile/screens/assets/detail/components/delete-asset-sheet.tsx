import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { ConfirmSheet } from "@workspace/ui-native/components/wassiya/confirm-sheet"
import { router } from "expo-router"

import { useStrings } from "@/i18n/use-strings"

/**
 * Deleting an asset. A handed-over one says that the executors will not
 * receive it — the cost of deleting it is never the asset, and this is the
 * only moment that can still change anything.
 */
export type DeleteAssetSheetProps = {
  assetId: Id<"assets">
  /** The asset's decrypted name, for the question. */
  name: string
  /** Handed over: the executors lose it, and the sheet says so. */
  handedOver: boolean
  open: boolean
  onClose: () => void
}

export function DeleteAssetSheet({
  assetId,
  name,
  handedOver,
  open,
  onClose,
}: DeleteAssetSheetProps) {
  const { t } = useStrings("assets/detail")
  const remove = useMutation(api.assets.remove)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function destroy(dismiss: () => Promise<void>) {
    setBusy(true)
    setFailed(false)
    try {
      await remove({ assetId })
      await dismiss()
      // `replace`, not `back`: the screen behind this one is an asset that no
      // longer exists, and popping onto it would render a dead query.
      router.replace("/assets")
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }

  return (
    <ConfirmSheet
      open={open}
      onClose={onClose}
      title={t.deleteSheetTitle!.replace("{name}", name)}
      body={handedOver ? [t.deleteFinal!, t.executorsLoseIt!] : [t.deleteFinal!]}
      confirmLabel={t.deletePermanently!}
      busyLabel={t.deleting}
      cancelLabel={t.keepIt!}
      onConfirm={(dismiss) => void destroy(dismiss)}
      busy={busy}
      error={failed ? t.deleteFailed! : null}
    />
  )
}
