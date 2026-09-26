import { useEffect, useRef, useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { Text } from "@workspace/ui-native/components/ui/text"
import { Sheet } from "@workspace/ui-native/components/wassiya/sheet"
import { router } from "expo-router"
import { Pressable } from "react-native"

import { useStrings } from "@/i18n/use-strings"

/**
 * Deleting an executor — consequence before confirmation. Removing the only one
 * means no delivery is ever created, so what the owner handed over reaches
 * nobody; that is said here, at the last moment it can change anything.
 *
 * Destructive is outlined, safe is filled: a solid button in this product
 * means *proceed calmly*, and keeping the executor is the calm path.
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
  const sheet = useRef<TrueSheet>(null)
  const remove = useMutation(api.executors.remove)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  // Only dismiss something that was presented: a dismiss on every mount makes
  // TrueSheet warn once per screen opened.
  const presented = useRef(false)
  useEffect(() => {
    if (open) {
      presented.current = true
      void sheet.current?.present()
      return
    }
    if (presented.current) void sheet.current?.dismiss()
  }, [open])

  async function destroy() {
    setBusy(true)
    setFailed(false)
    try {
      await remove({ executorId })
      await sheet.current?.dismiss()
      // `replace`: the screen behind is an edit form for someone who no longer
      // exists.
      router.replace("/executors")
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }

  return (
    <Sheet ref={sheet} onDismiss={onClose} contentClassName="px-6 pb-[26px] pt-4">
      <Text className="font-heading-extrabold text-foreground mb-3 text-[24px] leading-[1.3]">
        {t.deleteTitle!.replace("{name}", name)}
      </Text>

      <Text className="mb-3 text-[15px] leading-[1.75] opacity-75">
        {(isOnly ? t.deleteLast! : t.deleteBody!).replace("{name}", name)}
      </Text>
      <Text className="mb-[22px] text-[15px] leading-[1.75] opacity-75">
        {t.deleteFinal}
      </Text>

      {failed ? (
        <Text variant="meta" className="text-terracotta-800 mb-3">
          {t.deleteFailed}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => void destroy()}
        disabled={busy}
        className="border-primary mb-2.5 h-[54px] items-center justify-center rounded-full border-[1.5px] active:opacity-70"
      >
        <Text className="text-terracotta-800 font-heading-extrabold text-[16px]">
          {busy ? t.deleting : t.deletePermanently}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        disabled={busy}
        className="bg-card h-[54px] items-center justify-center rounded-full active:opacity-80"
      >
        <Text className="font-heading-extrabold text-foreground text-[16px]">
          {t.keepIt}
        </Text>
      </Pressable>
    </Sheet>
  )
}
