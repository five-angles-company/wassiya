import { useEffect, useRef, useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { Text } from "@workspace/ui-native/components/ui/text"
import { Sheet } from "@workspace/ui-native/components/wassiya/sheet"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { Pressable } from "react-native"

import { useStrings } from "@/i18n/use-strings"

/**
 * Deleting an heir — consequence before confirmation.
 *
 * `heirs.remove` cascades further than "delete" suggests: it drops every
 * `assetRecipients` row pointing at this heir and destroys their release bundle
 * and its blob. So removing an heir who receives four assets silently leaves
 * **four assets with no recipient** and voids their share of K_h. An owner only
 * trying to fix a mistake needs to learn that here, at the last moment it can
 * still change anything — hence the count, by name, rather than "are you sure?".
 *
 * **Destructive is outlined, safe is filled.** The inversion is deliberate
 * rule: a solid button in this product means *proceed calmly*, and keeping the
 * heir is the calm path. No red — terracotta already carries the weight, and red
 * would be the only alien colour in the product.
 */
export type DeleteHeirSheetProps = {
  heirId: Id<"heirs">
  name: string
  /** Drives which consequence sentence is shown. */
  routedAssetCount: number
  open: boolean
  onClose: () => void
}

export function DeleteHeirSheet({
  heirId,
  name,
  routedAssetCount,
  open,
  onClose,
}: DeleteHeirSheetProps) {
  const { t, locale } = useStrings("heirs/edit")
  const sheet = useRef<TrueSheet>(null)
  const remove = useMutation(api.heirs.remove)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  /**
   * Only dismiss something that was actually presented.
   *
   * Reacting to `open === false` unconditionally fires a dismiss on every
   * mount — one per heir screen opened — and TrueSheet warns each time. The ref
   * remembers whether this sheet has ever been up, so the first render is
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
      await remove({ heirId })
      await sheet.current?.dismiss()
      // `replace`, not `back`: the screen behind this one is an edit form for
      // an heir that no longer exists, and popping onto it renders a dead query.
      router.replace("/heirs")
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
        {routedAssetCount > 0
          ? t
              .deleteRouted!.replace("{name}", name)
              .replace("{n}", fmtNum(routedAssetCount, locale))
          : t.deleteNothing!.replace("{name}", name)}
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
