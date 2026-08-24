import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { router } from "expo-router"
import { Trash2 } from "lucide-react-native"
import { Alert } from "react-native"

export type DeleteAssetButtonProps = {
  assetId: Id<"assets">
  labels: Record<string, string>
  onError: () => void
}

/**
 * Deletion, as an outlined confirm.
 *
 * The board is specific about the colour and the copy: *"an outlined confirm
 * naming the recipients who lose access — this palette has no red and doesn't
 * need one."* The `destructive` variant here is already a deep-terracotta
 * outline for exactly that reason.
 *
 * The recipient-naming half of that instruction is not reachable yet: nothing
 * can be routed until section ٥, so every asset is unrouted and the confirm
 * uses the unrouted sentence. `deleteBodyRouted` exists in the catalogue with
 * its `{names}` slot ready, so the day routing lands this becomes a one-line
 * change rather than a rewrite.
 *
 * `assets.remove` deletes the routing rows and the stored blobs too, so this is
 * genuinely irreversible — which is why it asks first, and why the confirm says
 * the content is destroyed rather than "removed".
 */
export function DeleteAssetButton({
  assetId,
  labels,
  onError,
}: DeleteAssetButtonProps) {
  const remove = useMutation(api.assets.remove)
  const [busy, setBusy] = useState(false)

  function confirm() {
    Alert.alert(labels.deleteTitle!, labels.deleteBodyUnrouted!, [
      { text: labels.deleteCancel!, style: "cancel" },
      {
        text: labels.deleteConfirm!,
        style: "destructive",
        onPress: () => {
          void (async () => {
            setBusy(true)
            try {
              await remove({ assetId })
              // Back to 4.1 rather than forward: the row that led here no
              // longer exists, so there is nothing to return to.
              router.back()
            } catch {
              onError()
            } finally {
              setBusy(false)
            }
          })()
        },
      },
    ])
  }

  return (
    <Button
      variant="destructive"
      className="mt-6"
      onPress={confirm}
      disabled={busy}
    >
      <Icon as={Trash2} className="text-destructive size-4.5" />
      <Text>{labels.deleteLabel}</Text>
    </Button>
  )
}
