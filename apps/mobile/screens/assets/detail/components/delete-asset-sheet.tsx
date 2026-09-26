import { useRef, useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { Text } from "@workspace/ui-native/components/ui/text"
import { Sheet } from "@workspace/ui-native/components/wassiya/sheet"
import { router } from "expo-router"
import { useEffect } from "react"
import { Pressable } from "react-native"

import { useStrings } from "@/i18n/use-strings"

/**
 * Deleting an asset — consequence before confirmation.
 *
 * A handed-over asset says that the executors will not receive it, because the
 * cost of deleting it is never the asset — and this is the only moment that
 * can still change anything.
 *
 * **Destructive is outlined, safe is filled.** The rule is deliberate — a solid
 * button in this system means *proceed calmly*, and keeping the asset is the
 * calm path. No red; terracotta already carries the weight, and red would be the
 * only alien colour in the product.
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
  const sheet = useRef<TrueSheet>(null)
  const remove = useMutation(api.assets.remove)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  /**
   * Only dismiss something that was actually presented.
   *
   * Reacting to `open === false` unconditionally fires a dismiss on every
   * mount — one per asset screen opened — and TrueSheet warns each time. The
   * ref remembers whether this sheet has ever been up, so the first render is
   * silent.
   */
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
      await remove({ assetId })
      await sheet.current?.dismiss()
      // `replace`, not `back`: the screen behind this one is an asset that no
      // longer exists, and popping onto it would render a dead query.
      router.replace("/assets")
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }

  return (
    <Sheet ref={sheet} onDismiss={onClose} contentClassName="px-6 pb-[26px] pt-4">
      <Text className="font-heading-extrabold text-foreground mb-3 text-[24px] leading-[1.3]">
        {t.deleteSheetTitle!.replace("{name}", name)}
      </Text>
      <Text className="mb-[22px] text-[15px] leading-[1.75] opacity-75">
        {t.deleteFinal}
      </Text>

      {handedOver ? (
        <Text className="mb-6 text-[15px] leading-[1.75]">{t.executorsLoseIt}</Text>
      ) : null}

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
