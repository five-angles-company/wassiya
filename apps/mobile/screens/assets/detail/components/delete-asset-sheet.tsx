import { useRef, useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { Text } from "@workspace/ui-native/components/ui/text"
import { Sheet } from "@workspace/ui-native/components/wassiya/sheet"
import { router } from "expo-router"
import { useEffect } from "react"
import { Pressable, View } from "react-native"

import { useStrings } from "@/i18n/use-strings"

/**
 * Deleting an asset — consequence before confirmation.
 *
 * The sheet names **the people who lose access**, because the cost of deleting
 * an asset is never the asset. An owner who has forgotten that this wallet is
 * the one routed to their daughter finds out here, at the only moment the
 * information can still change anything.
 *
 * Those names are hairline rows, exactly as everywhere else in the vault: two
 * people who lose something are a list, not a warning box.
 *
 * ## Destructive is outlined, safe is filled
 *
 * The inversion is deliberate and it is the board's own rule: in this system a
 * solid button means *proceed calmly*, and keeping the asset is the calm path.
 * The filled control is therefore "إبقاء", and destruction is the outlined one
 * you have to aim at.
 *
 * No red. Terracotta already carries the weight here, and red would be the only
 * alien colour in the product.
 */
export type DeleteAssetSheetProps = {
  assetId: Id<"assets">
  /** The asset's decrypted name, for the question. */
  name: string
  /** Who loses access. Empty gives the shorter sheet. */
  recipients: string[]
  open: boolean
  onClose: () => void
}

export function DeleteAssetSheet({
  assetId,
  name,
  recipients,
  open,
  onClose,
}: DeleteAssetSheetProps) {
  const { t } = useStrings("assets/detail")
  const sheet = useRef<TrueSheet>(null)
  const remove = useMutation(api.assets.remove)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (open) void sheet.current?.present()
    else void sheet.current?.dismiss()
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

      {recipients.length > 0 ? (
        <View className="mb-6">
          {recipients.map((who, i) => (
            <View key={`${who}-${i}`}>
              <View className="flex-row items-center gap-[13px] py-3">
                <View
                  className={`size-[34px] shrink-0 items-center justify-center rounded-full ${
                    i % 2 === 0 ? "bg-olive-200" : "bg-olive-300"
                  }`}
                >
                  <Text className="font-body-bold text-olive-900 text-[13px]">
                    {[...who.trim()][0] ?? "?"}
                  </Text>
                </View>
                <Text className="flex-1 text-[14.5px]">
                  {t.losesAccess!.replace("{name}", who)}
                </Text>
              </View>
              {i < recipients.length - 1 ? (
                <View className="bg-border ms-[47px] h-px" />
              ) : null}
            </View>
          ))}
        </View>
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
